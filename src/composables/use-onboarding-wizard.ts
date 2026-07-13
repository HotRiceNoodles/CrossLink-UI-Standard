import { ref, reactive, computed } from 'vue'
import type { InjectionKey } from 'vue'
import { useI18n } from 'vue-i18n'
import { onboardingApi } from '@/api/onboarding'
import { providerApi } from '@/api/provider'
import { useLoading } from '@/hooks/loading'
import type {
  OnboardingMode,
  OnboardingRequest,
  OnboardingResult,
  ProbeRequest,
  ProbeResult,
  Adapter,
} from '@/types'

/** localStorage key：完成='1'，跳过='skip' */
export const ONBOARDING_DONE_KEY = 'onboarding_done'
export const ONBOARDING_EVENT = 'reopen-onboarding'

/** provide/inject key：主组件向各步骤子组件共享同一份向导状态。 */
export type OnboardingWizardStore = ReturnType<typeof useOnboardingWizard>
export const OnboardingWizardKey: InjectionKey<OnboardingWizardStore> = Symbol('onboarding-wizard')

/**
 * 域名 → adapter 推断（仅推荐高亮，不强制）。对应设计文档快速模式逻辑。
 * 返回 adapter_type 或 null（无法推断）。
 */
export function inferAdapter(baseUrl: string): string | null {
  const s = (baseUrl || '').toLowerCase()
  if (!s) return null
  if (/anthropic/.test(s)) return 'anthropic'
  if (/(localhost|127\.0\.0\.1):11434/.test(s) || /\/ollama/.test(s)) return 'ollama'
  if (
    /(deepseek|openai|moonshot|siliconflow|xai|groq|together|fireworks|openrouter|zhipu|bigmodel|yi|baichuan|minimax|stepfun|volces|doubao)/.test(
      s,
    )
  )
    return 'openai_compatible'
  return null
}

/**
 * 从 base_url 提取 provider 默认 name（取主域名的首段，去掉 www/api 前缀）。
 * https://api.deepseek.com/v1 → deepseek
 */
export function deriveProviderName(baseUrl: string): string {
  try {
    const u = new URL(baseUrl)
    const host = u.hostname.replace(/^(www|api)\./, '')
    return host.split('.')[0].toLowerCase() || ''
  } catch {
    return ''
  }
}

/** 模型分类关键词，对应设计文档模型勾选分组。 */
export const MODEL_CATEGORIES = [
  {
    key: 'chat',
    label: 'onboarding.catChat',
    pattern: /gpt|claude|deepseek|qwen|llama|chat|glm|gemini|mistral|yi|moonshot/i,
  },
  { key: 'reason', label: 'onboarding.catReason', pattern: /o1|o3|reason|r1|think/i },
  {
    key: 'image',
    label: 'onboarding.catImage',
    pattern: /dall-?e|image|flux|sd|stable|midjourney/i,
  },
  { key: 'audio', label: 'onboarding.catAudio', pattern: /whisper|tts|audio|voice|speech/i },
  { key: 'embed', label: 'onboarding.catEmbed', pattern: /embed/i },
] as const

export function categorizeModel(id: string): string {
  for (const c of MODEL_CATEGORIES) {
    if (c.pattern.test(id)) return c.key
  }
  return 'other'
}

/** adapter 不支持探测时的常用模型预设。 */
export const MANUAL_MODEL_PRESETS: Record<string, string[]> = {
  anthropic: ['claude-sonnet-4-5-20250514', 'claude-haiku-4-5-20241022', 'claude-opus-4-20250514'],
}

export interface ProviderForm {
  name: string
  display_name: string
  adapter_type: string
  base_url: string
  api_key: string
  extra_config: Record<string, unknown>
}

export interface KeyForm {
  name: string
  tpm_limit: number | null
  rpm_limit: number | null
  max_budget: number | null
  budget_period: string
}

function defaultProvider(): ProviderForm {
  return {
    name: '',
    display_name: '',
    adapter_type: 'openai_compatible',
    base_url: '',
    api_key: '',
    extra_config: {},
  }
}

function defaultKey(): KeyForm {
  return { name: '', tpm_limit: null, rpm_limit: null, max_budget: null, budget_period: 'monthly' }
}

/**
 * 向导状态机。组件挂载时调用一次，集中持有 mode/step/表单/probe/提交状态。
 * 设计文档明确不引 Pinia，状态由本 composable + v-show 步骤切换承载。
 */
export function useOnboardingWizard() {
  const { t } = useI18n()
  const { loading: probing, setLoading: setProbing } = useLoading(false)
  const { loading: submitting, setLoading: setSubmitting } = useLoading(false)

  const mode = ref<OnboardingMode | null>(null)
  const currentStep = ref(0)

  const provider = reactive<ProviderForm>(defaultProvider())
  const keyForm = reactive<KeyForm>(defaultKey())

  const probeResult = ref<ProbeResult | null>(null)
  const probeError = ref('') // 人性化后的错误文案（已翻译）

  const selectedModels = ref<string[]>([])
  const manualModels = ref<string[]>([])
  const manualInput = ref('')

  const result = ref<OnboardingResult | null>(null)
  const submitError = ref('')

  const adapters = ref<Adapter[]>([])

  // quick: 3 步（credentials / models+key / result）
  // custom: 5 步（adapter / credentials / models / key / result）
  const totalSteps = computed(() => (mode.value === 'quick' ? 3 : 5))

  const inferredAdapter = computed(() => inferAdapter(provider.base_url))

  const probeModels = computed(() => probeResult.value?.models ?? [])

  /** 探测成功且拿到了模型列表。 */
  const hasModelsFromProbe = computed(
    () =>
      !!probeResult.value &&
      probeResult.value.success &&
      probeResult.value.models_supported &&
      probeModels.value.length > 0,
  )

  /** 最终纳入提交的模型 id 集合（探测勾选 ∪ 手填），去重。 */
  const effectiveModels = computed(() => {
    const set = new Set<string>([...selectedModels.value, ...manualModels.value])
    return [...set]
  })

  function setMode(m: OnboardingMode) {
    mode.value = m
    currentStep.value = 0
  }

  // —— 步骤导航 ——
  const canGoPrev = computed(() => currentStep.value > 0)

  /**
   * 当前步是否允许进入下一步（Next/提交按钮 disabled 判定）。
   * quick: 0=需探测成功; 1=至少 1 个模型 + key 名
   * custom: 0=已选 adapter; 1=探测成功或手填模式; 2=至少 1 个模型; 3=key 名
   * 结果步无 Next。
   */
  const canGoNext = computed(() => {
    if (mode.value === null) return false
    const isLast = currentStep.value === totalSteps.value - 1
    if (isLast) return false
    if (mode.value === 'quick') {
      if (currentStep.value === 0) return !!probeResult.value?.success
      if (currentStep.value === 1) return effectiveModels.value.length > 0 && !!keyForm.name.trim()
      return true
    }
    // custom
    if (currentStep.value === 0) return !!provider.adapter_type
    if (currentStep.value === 1)
      return !!probeResult.value?.success || manualModels.value.length > 0
    if (currentStep.value === 2) return effectiveModels.value.length > 0
    if (currentStep.value === 3) return !!keyForm.name.trim()
    return true
  })

  function next() {
    if (!canGoNext.value) return
    if (currentStep.value < totalSteps.value - 1) currentStep.value++
  }
  function prev() {
    submitError.value = ''
    if (currentStep.value > 0) currentStep.value--
  }

  // —— adapter ——
  async function loadAdapters() {
    if (adapters.value.length) return
    try {
      const res = await providerApi.adapters()
      adapters.value = res.data ?? []
    } catch {
      adapters.value = []
    }
  }

  function selectAdapter(type: string) {
    provider.adapter_type = type
    const a = adapters.value.find((x) => x.type === type)
    if (a?.base_url_default && !provider.base_url) provider.base_url = a.base_url_default
  }

  // —— 探测 ——
  /** 将后端 probe error 字符串人性化映射为前端文案。 */
  function humanizeProbeError(error: string): string {
    const s = (error || '').toLowerCase()
    if (/401|unauthor/.test(s)) return t('onboarding.errAuth')
    if (/403|forbidden/.test(s)) return t('onboarding.errForbidden')
    if (/timeout|deadline|context deadline/.test(s)) return t('onboarding.errTimeout')
    if (/connection refused|no such host|dns|reset/.test(s)) return t('onboarding.errConn')
    return error || t('onboarding.errUnknown')
  }

  async function runProbe() {
    probeError.value = ''
    probeResult.value = null
    selectedModels.value = []
    if (!provider.adapter_type) {
      probeError.value = t('onboarding.errNoAdapter')
      return
    }
    if (!provider.base_url) {
      probeError.value = t('onboarding.errNoUrl')
      return
    }
    const payload: ProbeRequest = {
      adapter_type: provider.adapter_type,
      base_url: provider.base_url,
      api_key: provider.api_key || undefined,
    }
    setProbing(true)
    try {
      const res = await onboardingApi.probe(payload)
      probeResult.value = res.data
      if (!res.data.success) {
        probeError.value = humanizeProbeError(res.data.error || '')
      } else if (res.data.models_supported && (res.data.models?.length ?? 0) > 0) {
        // 默认勾选首个对话类模型
        const firstChat = res.data.models!.find((m) => categorizeModel(m.id) === 'chat')
        if (firstChat) selectedModels.value = [firstChat.id]
      }
    } catch {
      // probe 走 axios，网络层错误到这里
      probeError.value = t('onboarding.errNetwork')
    } finally {
      setProbing(false)
    }
  }

  function toggleModel(id: string) {
    const i = selectedModels.value.indexOf(id)
    if (i >= 0) selectedModels.value.splice(i, 1)
    else selectedModels.value.push(id)
  }

  function addManualModel(id: string) {
    const v = id.trim()
    if (!v) return
    if (!manualModels.value.includes(v)) manualModels.value.push(v)
    manualInput.value = ''
  }
  function removeManualModel(id: string) {
    const i = manualModels.value.indexOf(id)
    if (i >= 0) manualModels.value.splice(i, 1)
  }

  // —— 提交 ——
  function buildPayload(): OnboardingRequest {
    const models = effectiveModels.value.map((m) => ({
      model_name: m,
      provider_model: m,
      routing_strategy: 'weighted_random' as const,
    }))
    const k = keyForm
    return {
      provider: {
        name: provider.name.trim(),
        display_name: provider.display_name.trim() || provider.name.trim(),
        adapter_type: provider.adapter_type,
        base_url: provider.base_url || undefined,
        api_key: provider.api_key || undefined,
        extra_config: Object.keys(provider.extra_config).length ? provider.extra_config : undefined,
      },
      models,
      key: {
        name: k.name.trim(),
        allowed_models: models.length ? models.map((m) => m.model_name) : undefined,
        tpm_limit: k.tpm_limit || undefined,
        rpm_limit: k.rpm_limit || undefined,
        max_budget: k.max_budget || undefined,
        budget_period: k.budget_period || undefined,
      },
    }
  }

  async function submit() {
    submitError.value = ''
    setSubmitting(true)
    try {
      const res = await onboardingApi.commit(buildPayload())
      result.value = res.data
      currentStep.value = totalSteps.value - 1 // 跳到结果步
    } catch (err) {
      const e = err as { response?: { data?: { error?: string; error_code?: string } } }
      const code = e.response?.data?.error_code
      if (code === 'conflict') submitError.value = t('onboarding.errConflict')
      else if (code === 'provider_url_invalid') submitError.value = t('onboarding.errUrlInvalid')
      else if (code === 'invalid_request') submitError.value = t('onboarding.errInvalid')
      else submitError.value = e.response?.data?.error || t('onboarding.errSubmit')
    } finally {
      setSubmitting(false)
    }
  }

  function resetState() {
    mode.value = null
    currentStep.value = 0
    Object.assign(provider, defaultProvider())
    Object.assign(keyForm, defaultKey())
    probeResult.value = null
    probeError.value = ''
    selectedModels.value = []
    manualModels.value = []
    manualInput.value = ''
    result.value = null
    submitError.value = ''
  }

  return {
    // state
    mode,
    currentStep,
    totalSteps,
    provider,
    keyForm,
    probeResult,
    probeError,
    probing,
    submitting,
    submitError,
    selectedModels,
    manualModels,
    manualInput,
    result,
    adapters,
    // derived
    inferredAdapter,
    probeModels,
    hasModelsFromProbe,
    effectiveModels,
    canGoNext,
    canGoPrev,
    // actions
    setMode,
    next,
    prev,
    loadAdapters,
    selectAdapter,
    runProbe,
    toggleModel,
    addManualModel,
    removeManualModel,
    buildPayload,
    submit,
    resetState,
  }
}

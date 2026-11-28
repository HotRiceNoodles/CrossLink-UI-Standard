<template>
  <a-drawer
    :visible="visible"
    :width="600"
    :title="isEdit ? t('model.editModel') : t('model.newModel')"
    :mask-closable="false"
    unmount-on-close
    :ok-loading="submitLoading"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <a-form-item
        field="provider_id"
        :label="t('model.providerLabel')"
        :rules="[{ required: true, message: t('model.providerRequired') }]"
      >
        <a-select
          v-model="formData.provider_id"
          :placeholder="t('model.providerPlaceholder')"
          :disabled="isProviderLocked || isEdit"
        >
          <a-option v-for="p in providerList" :key="p.id" :value="p.id" :label="p.display_name" />
        </a-select>
      </a-form-item>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item
            field="model_name"
            :label="t('model.modelNameLabel')"
            :rules="[{ required: true, message: t('model.modelNameRequired') }]"
          >
            <!-- 后端 Update 不接受 model_name（改公开模型名属破坏性变更），编辑态禁改 -->
            <a-input
              v-model="formData.model_name"
              :placeholder="t('model.modelNamePlaceholder')"
              :disabled="isEdit"
            />
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="12">
          <a-form-item
            field="provider_model"
            :label="t('model.providerModelLabel')"
            :rules="[{ required: true, message: t('model.providerModelRequired') }]"
          >
            <!-- 后端 Update 不接受 provider_model，编辑态禁改 -->
            <a-input
              v-model="formData.provider_model"
              :placeholder="t('model.providerModelPlaceholder')"
              :disabled="isEdit"
            />
          </a-form-item>
        </a-grid-item>
      </a-grid>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item field="weight" :label="t('model.weightLabel')">
            <a-input-number
              v-model="formData.weight"
              :min="0"
              :max="100"
              :default-value="1"
              style="width: 100%"
            />
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="12">
          <a-form-item field="priority" :label="t('model.priorityLabel')">
            <a-input-number
              v-model="formData.priority"
              :min="1"
              :max="100"
              :default-value="1"
              style="width: 100%"
            />
          </a-form-item>
        </a-grid-item>
      </a-grid>

      <!-- max_context（bdbfe11 起后端消费）：上游上下文窗口，供上下文分析与预算估算；
           正整数；留空 = 未知（编辑时留空 = 保持不变） -->
      <a-form-item field="max_context" :label="t('model.maxContext')">
        <a-input-number
          v-model="formData.max_context"
          :min="1"
          :placeholder="t('model.maxContextPlaceholder')"
          allow-clear
          style="width: 100%"
        />
        <template #extra>{{ t('model.maxContextHint') }}</template>
      </a-form-item>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item field="input_price" :label="t('model.inputPriceLabel')">
            <a-input-number
              v-model="formData.input_price"
              :min="0"
              :precision="6"
              :step="0.000001"
              placeholder="0.000000"
              style="width: 100%"
            />
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="12">
          <a-form-item field="output_price" :label="t('model.outputPriceLabel')">
            <a-input-number
              v-model="formData.output_price"
              :min="0"
              :precision="6"
              :step="0.000001"
              placeholder="0.000000"
              style="width: 100%"
            />
          </a-form-item>
        </a-grid-item>
      </a-grid>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item field="modality" :label="t('model.modalityLabel')">
            <a-select v-model="formData.modality" :placeholder="t('model.modalityPh')">
              <a-option value="" :label="t('model.modalityNone')" />
              <a-option
                v-for="m in MODALITIES"
                :key="m"
                :value="m"
                :label="t(`model.modality_${m}`)"
              />
            </a-select>
            <template #extra>{{ t('model.modalityTip') }}</template>
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="12">
          <a-form-item field="routing_strategy" :label="t('model.routingStrategyLabel')">
            <a-select
              v-model="formData.routing_strategy"
              :placeholder="t('model.routingStrategyPlaceholder')"
            >
              <a-option
                v-for="s in strategyOptions"
                :key="s.value"
                :value="s.value"
                :label="s.label"
              />
            </a-select>
          </a-form-item>
        </a-grid-item>
      </a-grid>

      <a-form-item field="supports_responses" :label="t('model.supportsResponsesLabel')">
        <a-switch v-model="supportsResponses" />
        <span class="supports-responses-helper">{{ t('model.supportsResponsesHelper') }}</span>
      </a-form-item>

      <!-- 扩展参数与计价治理（extra_config 治理键，写入时后端校验；默认收起） -->
      <a-collapse v-model:active-key="extActiveKeys" :bordered="false" class="ext-collapse">
        <a-collapse-item key="ext">
          <template #header>
            <a-space :size="8">
              <span>{{ t('model.extSection') }}</span>
              <!-- 已配置项计数徽标：收起时也可见，避免“藏着找不到” -->
              <a-badge v-if="extConfiguredCount > 0" :count="extConfiguredCount" color="arcoblue" />
            </a-space>
          </template>
          <!-- 允许转发的方言扩展参数：选项来自 /gateway/capabilities（与代码真值同源） -->
          <a-form-item :label="t('model.extAllowed')">
            <a-checkbox-group v-model="extAllowed" direction="vertical">
              <a-checkbox v-for="name in dialectParams" :key="name" :value="name">
                <span class="mono">{{ name }}</span>
                <span class="ext-desc">{{ extParamDesc(name) }}</span>
              </a-checkbox>
            </a-checkbox-group>
            <template #extra>{{ t('model.extAllowedTip') }}</template>
          </a-form-item>

          <!-- 模型级生成参数覆盖：留空 = 不覆盖 -->
          <a-form-item :label="t('model.extOverrides')">
            <a-grid :cols="24" :col-gap="12">
              <a-grid-item :span="8">
                <a-input-number
                  v-model="extOverrides.temperature"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  placeholder="temperature"
                  allow-clear
                  style="width: 100%"
                />
              </a-grid-item>
              <a-grid-item :span="8">
                <a-input-number
                  v-model="extOverrides.top_p"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  placeholder="top_p"
                  allow-clear
                  style="width: 100%"
                />
              </a-grid-item>
              <a-grid-item :span="8">
                <a-select
                  v-model="extOverrides.enable_thinking"
                  :placeholder="'enable_thinking'"
                  allow-clear
                >
                  <a-option :value="true" label="true" />
                  <a-option :value="false" label="false" />
                </a-select>
              </a-grid-item>
            </a-grid>
            <template #extra>{{ t('model.extOverridesTip') }}</template>
          </a-form-item>

          <!-- responses 计价：档位乘数与工具单价（键值对，可多行） -->
          <a-form-item :label="t('model.extTierMultipliers')">
            <div class="kv-editor">
              <div v-for="(row, i) in extTierRows" :key="i" class="kv-row">
                <a-input v-model="row.key" :placeholder="t('model.extTierKeyPh')" allow-clear />
                <a-input-number
                  v-model="row.value"
                  :min="0.000001"
                  :precision="6"
                  :step="0.1"
                  placeholder="×1.0"
                  style="width: 140px"
                />
                <a-button
                  type="text"
                  status="danger"
                  size="small"
                  @click="extTierRows.splice(i, 1)"
                >
                  <template #icon><icon-delete /></template>
                </a-button>
              </div>
              <a-button size="small" @click="extTierRows.push({ key: '', value: undefined })">
                {{ t('common.add') }}
              </a-button>
            </div>
            <template #extra>{{ t('model.extTierTip') }}</template>
          </a-form-item>

          <a-form-item :label="t('model.extToolPrices')">
            <div class="kv-editor">
              <div v-for="(row, i) in extToolRows" :key="i" class="kv-row">
                <a-input v-model="row.key" :placeholder="t('model.extToolKeyPh')" allow-clear />
                <a-input-number
                  v-model="row.value"
                  :min="0"
                  :precision="6"
                  :step="0.001"
                  placeholder="0.000"
                  style="width: 140px"
                />
                <a-button
                  type="text"
                  status="danger"
                  size="small"
                  @click="extToolRows.splice(i, 1)"
                >
                  <template #icon><icon-delete /></template>
                </a-button>
              </div>
              <a-button size="small" @click="extToolRows.push({ key: '', value: undefined })">
                {{ t('common.add') }}
              </a-button>
            </div>
          </a-form-item>
        </a-collapse-item>
      </a-collapse>

      <a-form-item v-if="isEdit" field="status" :label="t('model.statusLabel')">
        <a-select v-model="formData.status" :placeholder="t('model.statusPlaceholder')">
          <a-option :value="1" :label="t('common.enabled')" />
          <a-option :value="0" :label="t('common.disabled')" />
        </a-select>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { modelApi } from '@/api/model'
import { systemApi } from '@/api/system'
import { useLoading } from '@/hooks/loading'
import type { ProviderModel, Provider, ModelCreateRequest } from '@/types'

const { t } = useI18n()

const strategyMap: Record<string, { label: string; color: string }> = {
  weighted_random: { label: 'strategy.weighted_random', color: '#1D4ED8' },
  round_robin: { label: 'strategy.round_robin', color: '#D91AD9' },
  least_latency: { label: 'strategy.least_latency', color: '#0FC6C2' },
  least_cost: { label: 'strategy.least_cost', color: '#FF7D00' },
  canary: { label: 'strategy.canary', color: '#722ED1' },
  least_busy: { label: 'strategy.least_busy', color: '#F77234' },
}

const strategyOptions = computed(() =>
  Object.entries(strategyMap).map(([value, { label }]) => ({
    value,
    label: t(label),
  })),
)

interface Props {
  visible: boolean
  isEdit: boolean
  model?: ProviderModel
  providerList: Provider[]
  defaultProviderId?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const { loading: submitLoading, setLoading: setSubmitLoading } = useLoading()
const supportsResponses = ref(false)

// 后端 ValidModalities（图片方案 P3 §5.1）；'' = 未分类不列出（始终可选）
const MODALITIES = [
  'text',
  'image',
  'video',
  'audio_speech',
  'audio_transcription',
  'embedding',
] as const

// ---- 扩展参数与计价治理（extra_config 治理键，后端写入时校验）----
interface KvRow {
  key: string
  value?: number
}
const dialectParams = ref<string[]>([])
const extAllowed = ref<string[]>([])
const extOverrides = ref<{ temperature?: number; top_p?: number; enable_thinking?: boolean }>({})
const extTierRows = ref<KvRow[]>([])
const extToolRows = ref<KvRow[]>([])

// 选项清单来自 /gateway/capabilities（与运行中网关的准入表同源，永不漂移）
async function loadDialectParams() {
  try {
    const res = await systemApi.gatewayCapabilities()
    dialectParams.value = res.data.dialect_params ?? []
  } catch {
    dialectParams.value = []
  }
}

function extParamDesc(name: string): string {
  const map: Record<string, string> = {
    enable_thinking: t('model.extDescThinking'),
    output_config: t('model.extDescOutputConfig'),
  }
  return map[name] || ''
}

// 折叠区默认收起，但编辑已带治理配置的模型时自动展开（可发现性）
const extActiveKeys = ref<string[]>([])

const extConfiguredCount = computed(() => {
  const ov = extOverrides.value
  const overrideCount = [
    typeof ov.temperature === 'number',
    typeof ov.top_p === 'number',
    typeof ov.enable_thinking === 'boolean',
  ].filter(Boolean).length
  return (
    (extAllowed.value.length ? 1 : 0) +
    overrideCount +
    (kvRowsToMap(extTierRows.value) ? 1 : 0) +
    (kvRowsToMap(extToolRows.value) ? 1 : 0)
  )
})

function resetExtGovernance() {
  extActiveKeys.value = []
  extAllowed.value = []
  extOverrides.value = {}
  extTierRows.value = []
  extToolRows.value = []
}

function fillExtGovernance(extra?: Record<string, unknown>) {
  resetExtGovernance()
  if (!extra) return
  // 编辑态带治理配置 → 自动展开，让已有配置一眼可见
  const hasAny =
    Array.isArray(extra.allowed_extensions) && (extra.allowed_extensions as string[]).length
  if (hasAny) extActiveKeys.value = ['ext']
  extAllowed.value = Array.isArray(extra.allowed_extensions)
    ? [...(extra.allowed_extensions as string[])]
    : []
  const ov = extra.request_overrides as Record<string, unknown> | undefined
  if (ov && typeof ov === 'object') {
    extOverrides.value = {
      temperature: typeof ov.temperature === 'number' ? ov.temperature : undefined,
      top_p: typeof ov.top_p === 'number' ? ov.top_p : undefined,
      enable_thinking: typeof ov.enable_thinking === 'boolean' ? ov.enable_thinking : undefined,
    }
  }
  const tiers = extra.service_tier_multipliers as Record<string, number> | undefined
  if (tiers && typeof tiers === 'object') {
    extTierRows.value = Object.entries(tiers).map(([key, value]) => ({ key, value }))
  }
  const tools = extra.tool_prices as Record<string, number> | undefined
  if (tools && typeof tools === 'object') {
    extToolRows.value = Object.entries(tools).map(([key, value]) => ({ key, value }))
  }
}

function kvRowsToMap(rows: KvRow[]): Record<string, number> | undefined {
  const out: Record<string, number> = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (key && typeof row.value === 'number') out[key] = row.value
  }
  return Object.keys(out).length ? out : undefined
}

// 治理键从 base 剥离后按本地编辑态重建——清空即删除，不留旧值残留
function buildExtGovernance(): Record<string, unknown> {
  const governance: Record<string, unknown> = {}
  if (extAllowed.value.length) governance.allowed_extensions = [...extAllowed.value]
  const overrides: Record<string, unknown> = {}
  if (typeof extOverrides.value.temperature === 'number')
    overrides.temperature = extOverrides.value.temperature
  if (typeof extOverrides.value.top_p === 'number') overrides.top_p = extOverrides.value.top_p
  if (typeof extOverrides.value.enable_thinking === 'boolean')
    overrides.enable_thinking = extOverrides.value.enable_thinking
  if (Object.keys(overrides).length) governance.request_overrides = overrides
  const tiers = kvRowsToMap(extTierRows.value)
  if (tiers) governance.service_tier_multipliers = tiers
  const tools = kvRowsToMap(extToolRows.value)
  if (tools) governance.tool_prices = tools
  return governance
}

const EXT_GOVERNANCE_KEYS = [
  'allowed_extensions',
  'request_overrides',
  'service_tier_multipliers',
  'tool_prices',
]

const isProviderLocked = computed(() => !props.isEdit && !!props.defaultProviderId)

function createEmptyForm(): Partial<ModelCreateRequest> & { status?: number } {
  return {
    provider_id: props.defaultProviderId,
    model_name: '',
    provider_model: '',
    weight: 1,
    priority: 1,
    max_context: undefined,
    input_price: undefined,
    output_price: undefined,
    modality: '',
    routing_strategy: 'weighted_random',
    status: 1,
  }
}

const formData = reactive(createEmptyForm())

loadDialectParams()

const formRules = {
  provider_id: [{ required: true, message: t('model.providerRequired') }],
  model_name: [{ required: true, message: t('model.modelNameRequired') }],
  provider_model: [{ required: true, message: t('model.providerModelRequired') }],
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    if (props.isEdit && props.model) {
      Object.assign(formData, {
        provider_id: props.model.provider_id,
        model_name: props.model.model_name,
        provider_model: props.model.provider_model,
        weight: props.model.weight,
        priority: props.model.priority,
        max_context: props.model.max_context ?? undefined,
        input_price: props.model.input_price,
        output_price: props.model.output_price,
        modality: props.model.modality || '',
        routing_strategy: props.model.routing_strategy,
        status: props.model.status,
      })
      supportsResponses.value = Boolean(props.model.extra_config?.supports_responses)
      fillExtGovernance(props.model.extra_config)
    } else {
      Object.assign(formData, createEmptyForm())
      supportsResponses.value = false
      resetExtGovernance()
    }
  },
)

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const errors = await formRef.value?.validate()
  if (errors) return

  setSubmitLoading(true)
  try {
    // Preserve any pre-existing extra_config keys and surface the
    // /v1/responses passthrough flag the gateway reads (supports_responses).
    const baseExtraConfig: Record<string, unknown> = {
      ...((props.isEdit && props.model?.extra_config) || formData.extra_config || {}),
    }
    // 治理键以表单编辑态为准重建（清空即删除），其余键原样保留
    for (const k of EXT_GOVERNANCE_KEYS) delete baseExtraConfig[k]
    const extra_config: Record<string, unknown> = {
      ...baseExtraConfig,
      ...buildExtGovernance(),
      supports_responses: supportsResponses.value,
    }

    const payload: Partial<ModelCreateRequest> = {
      provider_id: formData.provider_id,
      model_name: formData.model_name,
      provider_model: formData.provider_model,
      weight: formData.weight,
      priority: formData.priority,
      // null = 未设置（创建）/ 保持不变（更新）
      max_context: formData.max_context ?? null,
      input_price: formData.input_price ?? null,
      output_price: formData.output_price ?? null,
      modality: formData.modality || undefined,
      routing_strategy: formData.routing_strategy,
      extra_config,
    }

    if (props.isEdit && props.model) {
      await modelApi.update(props.model.id, {
        ...payload,
        status: formData.status,
      })
      Message.success(t('common.updateSuccess'))
    } else {
      await modelApi.create(payload as ModelCreateRequest)
      Message.success(t('common.createSuccess'))
    }

    emit('update:visible', false)
    emit('success')
  } catch (err: unknown) {
    // 写侧能力门控（e79f5df）：不支持 3A 直通的 adapter 上开 supports_responses
    // 会被 400 model_extension_invalid 拒绝——透出后端原因而非通用文案
    const e = err as { response?: { data?: { error?: string } } }
    Message.error(e.response?.data?.error || t('common.operationFail'))
  } finally {
    setSubmitLoading(false)
  }
}
</script>

<style scoped>
.ext-collapse {
  margin-top: 4px;

  :deep(.arco-collapse-item-content) {
    padding-top: 0;
  }
}

.ext-desc {
  margin-left: 8px;
  color: var(--color-text-3);
  font-size: 12px;
}

.mono {
  font-family: var(--cl-font-mono);
  font-size: 12px;
}

.kv-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .kv-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
.supports-responses-helper {
  display: block;
  margin-top: 4px;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}
</style>

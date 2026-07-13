<template>
  <a-modal
    :visible="visible"
    :width="720"
    :mask-closable="false"
    :closable="false"
    :footer="false"
    :unmount-on-close="false"
    dialog-class="onboarding-wizard-modal"
    @cancel="onClose"
  >
    <template #title>
      <span class="wizard-title">{{ t('onboarding.title') }}</span>
      <span class="wizard-subtitle">{{ t('onboarding.subtitle') }}</span>
    </template>

    <div class="wizard-body">
      <!-- 步骤条（选择模式后显示） -->
      <a-steps
        v-if="mode !== null"
        :current="currentStep"
        size="small"
        class="wizard-steps"
        changeable
        @change="onStepClick"
      >
        <a-step v-for="(label, i) in stepLabels" :key="i" :title="label" />
      </a-steps>

      <!-- 各步面板：v-show 切换，保留探测结果与表单状态 -->
      <div v-show="activePanel === 'welcome'" class="wizard-panel">
        <step-welcome @select="onModeSelect" />
      </div>

      <div v-show="activePanel === 'adapter'" class="wizard-panel">
        <step-adapter />
      </div>

      <div v-show="activePanel === 'credentials'" class="wizard-panel">
        <step-credentials :quick="mode === 'quick'" />
      </div>

      <div v-show="activePanel === 'models'" class="wizard-panel">
        <step-models />
        <!-- quick 模式：模型与 Key 命名合并为一步 -->
        <div v-if="mode === 'quick'" class="quick-key">
          <a-form-item field="keyName" :label="t('onboarding.keyName')" required>
            <a-input
              v-model="keyForm.name"
              :placeholder="t('onboarding.keyNamePlaceholder')"
              allow-clear
            />
          </a-form-item>
        </div>
      </div>

      <div v-show="activePanel === 'key'" class="wizard-panel">
        <step-key />
      </div>

      <div v-show="activePanel === 'result'" class="wizard-panel">
        <step-result @done="onDone" />
      </div>
    </div>

    <!-- 自定义底栏 -->
    <div class="wizard-footer">
      <a-space>
        <a-button v-if="!isResult" @click="onClose">{{ t('onboarding.skip') }}</a-button>
      </a-space>
      <a-space>
        <a-button v-if="canGoPrev && !isResult" @click="prev">{{ t('onboarding.prev') }}</a-button>
        <!-- 提交步 -->
        <template v-if="isSubmitStep">
          <span v-if="submitError" class="submit-error">{{ submitError }}</span>
          <a-button type="primary" :loading="submitting" :disabled="!canGoNext" @click="submit">
            {{ t('onboarding.submit') }}
          </a-button>
        </template>
        <!-- 普通下一步（欢迎页无） -->
        <a-button
          v-else-if="!isResult && mode !== null"
          type="primary"
          :disabled="!canGoNext"
          @click="next"
        >
          {{ t('onboarding.next') }}
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useOnboardingWizard,
  OnboardingWizardKey,
  ONBOARDING_DONE_KEY,
} from '@/composables/use-onboarding-wizard'
import type { OnboardingMode } from '@/types'
import StepWelcome from './onboarding-wizard/step-welcome.vue'
import StepAdapter from './onboarding-wizard/step-adapter.vue'
import StepCredentials from './onboarding-wizard/step-credentials.vue'
import StepModels from './onboarding-wizard/step-models.vue'
import StepKey from './onboarding-wizard/step-key.vue'
import StepResult from './onboarding-wizard/step-result.vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [boolean] }>()

const { t } = useI18n()
const w = useOnboardingWizard()
provide(OnboardingWizardKey, w)

const {
  mode,
  currentStep,
  totalSteps,
  keyForm,
  canGoPrev,
  canGoNext,
  submitError,
  submitting,
  prev,
  next,
  submit,
} = w

const stepLabels = computed<string[]>(() => {
  if (mode.value === 'quick') {
    return [t('onboarding.stepCredentials'), t('onboarding.stepModels'), t('onboarding.stepResult')]
  }
  return [
    t('onboarding.stepAdapter'),
    t('onboarding.stepCredentials'),
    t('onboarding.stepModels'),
    t('onboarding.stepKey'),
    t('onboarding.stepResult'),
  ]
})

const activePanel = computed(() => {
  if (mode.value === null) return 'welcome'
  if (mode.value === 'quick') {
    return (['credentials', 'models', 'result'] as const)[currentStep.value]
  }
  return (['adapter', 'credentials', 'models', 'key', 'result'] as const)[currentStep.value]
})

const isResult = computed(() => mode.value !== null && currentStep.value === totalSteps.value - 1)
const isSubmitStep = computed(
  () => mode.value !== null && currentStep.value === totalSteps.value - 2,
)

function onModeSelect(m: OnboardingMode) {
  w.setMode(m)
}

// 允许点击已完成步骤回退，但不能向前跳过未达步骤
function onStepClick(idx: number) {
  if (idx < currentStep.value) currentStep.value = idx
}

// 关闭（跳过）：置 'skip'
function onClose() {
  localStorage.setItem(ONBOARDING_DONE_KEY, 'skip')
  emit('update:visible', false)
}

// 完成回调（结果页"完成"按钮）：置 '1'
function onDone() {
  localStorage.setItem(ONBOARDING_DONE_KEY, '1')
  emit('update:visible', false)
}

// 每次打开重置状态（设计文档要求重开重置）
watch(
  () => props.visible,
  (v) => {
    if (v) w.resetState()
  },
)
</script>

<style scoped lang="less">
.wizard-title {
  font-size: 16px;
  font-weight: 600;
}
.wizard-subtitle {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: normal;
  color: var(--color-text-3);
}
.wizard-body {
  min-height: 360px;
}
.wizard-steps {
  margin-bottom: 24px;
}
.wizard-panel {
  padding: 4px 2px;
}
.quick-key {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-fill-2);
}
.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-fill-2);
}
.submit-error {
  color: rgb(var(--danger-6));
  font-size: 13px;
  margin-inline-end: 8px;
}
</style>

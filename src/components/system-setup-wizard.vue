<template>
  <a-modal
    :visible="visible"
    :width="560"
    :mask-closable="false"
    :closable="false"
    :footer="false"
    :unmount-on-close="true"
    dialog-class="system-setup-modal"
    @cancel="onCancel"
  >
    <template #title>
      <div class="wizard-title">{{ t('setup.title') }}</div>
      <div class="wizard-subtitle">{{ t('setup.subtitle') }}</div>
    </template>

    <div class="wizard-body">
      <a-steps :current="step" size="small" class="wizard-steps">
        <a-step :title="t('setup.steps.timezone')" />
        <a-step :title="t('setup.steps.baseUrl')" />
        <a-step :title="t('setup.steps.encryption')" />
        <a-step :title="t('setup.steps.done')" />
      </a-steps>

      <!-- Step 1: timezone -->
      <div v-show="step === 0" class="wizard-panel">
        <a-form layout="vertical">
          <a-form-item :label="t('setup.timezoneLabel')">
            <a-auto-complete
              v-model="form.timezone"
              :data="timezoneSuggestions"
              :placeholder="t('setup.timezonePlaceholder')"
              allow-clear
            />
          </a-form-item>
        </a-form>
      </div>

      <!-- Step 2: base url -->
      <div v-show="step === 1" class="wizard-panel">
        <a-form layout="vertical">
          <a-form-item :label="t('setup.baseUrlLabel')" validate-trigger="blur">
            <a-input
              v-model="form.base_url"
              :placeholder="t('setup.baseUrlPlaceholder')"
              allow-clear
            />
            <template #extra>
              <span class="field-hint">{{ t('setup.baseUrlHint') }}</span>
            </template>
          </a-form-item>
        </a-form>
      </div>

      <!-- Step 3: encryption key -->
      <div v-show="step === 2" class="wizard-panel">
        <a-checkbox v-model="form.generate_encryption_key">
          {{ t('setup.generateKey') }}
        </a-checkbox>
        <p class="field-hint">{{ t('setup.generateKeyDesc') }}</p>
        <a-alert v-if="submitError" type="error">{{ submitError }}</a-alert>
      </div>

      <!-- Step 4: result -->
      <div v-if="step === 3" class="wizard-panel">
        <a-alert v-if="result?.restart_recommended" type="warning" class="restart-alert">
          {{ t('setup.restartRecommended') }}
        </a-alert>
        <div class="applied-title">{{ t('setup.applied') }}</div>
        <ul class="applied-list">
          <li v-for="(value, key) in result?.applied" :key="key">
            <code>{{ key }}</code>
            <span>: {{ key === 'encryption_key' ? '✓' : value }}</span>
          </li>
        </ul>
      </div>

      <!-- Footer -->
      <div class="wizard-footer">
        <a-button
          v-if="step < 3"
          type="text"
          status="warning"
          :disabled="submitting"
          @click="confirmSkip"
        >
          {{ t('setup.skip') }}
        </a-button>
        <span v-else></span>
        <a-space>
          <a-button v-if="step > 0 && step < 3" :disabled="submitting" @click="step--">
            {{ t('setup.back') }}
          </a-button>
          <a-button v-if="step < 2" type="primary" @click="step++">
            {{ t('setup.next') }}
          </a-button>
          <a-button v-if="step === 2" type="primary" :loading="submitting" @click="submit">
            {{ t('setup.apply') }}
          </a-button>
          <a-button v-if="step === 3" type="primary" @click="onDone">
            {{ t('onboarding.finish') }}
          </a-button>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Modal } from '@arco-design/web-vue'
import { useSystemSetup } from '@/composables/use-system-setup'
import type { SetupApplyResponse } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const { t } = useI18n()
const { skip, apply, markDismissed } = useSystemSetup()

const step = ref(0)
const submitting = ref(false)
const submitError = ref('')
const result = ref<SetupApplyResponse | null>(null)

const form = ref({
  timezone: guessTimezone(),
  base_url: '',
  generate_encryption_key: false,
})

// Common-zone fallback when Intl.supportedValuesOf is unavailable.
const FALLBACK_ZONES = [
  'UTC',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Africa/Cairo',
]

function allTimezones(): string[] {
  const anyIntl = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[]
  }
  if (typeof anyIntl.supportedValuesOf === 'function') {
    try {
      return anyIntl.supportedValuesOf('timeZone')
    } catch {
      // fall through
    }
  }
  return FALLBACK_ZONES
}

function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}

const timezoneSuggestions = computed(() => {
  const input = (form.value.timezone || '').toLowerCase()
  const zones = allTimezones()
  const matches = input ? zones.filter((z) => z.toLowerCase().includes(input)) : zones
  return matches.slice(0, 20)
})

watch(
  () => props.visible,
  (v) => {
    if (v) {
      // Reopen resets to a clean, pre-filled state.
      step.value = 0
      submitError.value = ''
      result.value = null
      form.value = {
        timezone: guessTimezone(),
        base_url: '',
        generate_encryption_key: false,
      }
    }
  },
)

function close() {
  emit('update:visible', false)
}

// closable=false，仅兜底：直接关闭并记录 dismissal。
function onCancel() {
  markDismissed()
  close()
}

function confirmSkip() {
  Modal.confirm({
    title: t('setup.skipConfirmTitle'),
    content: t('setup.skipConfirmContent'),
    okText: t('setup.skip'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        await skip()
      } catch {
        // 后端失败也照样关闭：skip 只是记录状态
      }
      close()
    },
  })
}

function resolveError(err: unknown): string {
  const e = err as { response?: { data?: { error?: string; error_code?: string } } }
  const code = e.response?.data?.error_code
  const map: Record<string, string> = {
    setup_status_invalid: t('setup.errors.setup_status_invalid'),
    timezone_invalid: t('setup.errors.timezone_invalid'),
    base_url_invalid: t('setup.errors.base_url_invalid'),
    encryption_key_active: t('setup.errors.encryption_key_active'),
  }
  return map[code] || e.response?.data?.error || t('setup.errors.submitFail')
}

async function submit() {
  submitting.value = true
  submitError.value = ''
  try {
    result.value = await apply({
      timezone: form.value.timezone.trim(),
      base_url: form.value.base_url.trim(),
      generate_encryption_key: form.value.generate_encryption_key,
      status: 'done',
    })
    step.value = 3
  } catch (err) {
    submitError.value = resolveError(err)
  } finally {
    submitting.value = false
  }
}

function onDone() {
  close()
}
</script>

<style scoped lang="less">
.wizard-title {
  font-size: 16px;
  font-weight: 600;
}

.wizard-subtitle {
  font-size: 13px;
  color: var(--color-text-3);
  margin-top: 2px;
}

.wizard-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wizard-panel {
  min-height: 120px;
}

.field-hint {
  font-size: 12px;
  color: var(--color-text-3);
  margin: 8px 0 0;
}

.restart-alert {
  margin-bottom: 12px;
}

.applied-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.applied-list {
  margin: 0;
  padding-inline-start: 20px;
  font-size: 13px;
  color: var(--color-text-2);

  code {
    background-color: var(--color-fill-2);
    padding: 1px 4px;
    border-radius: 3px;
  }
}

.wizard-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-2);
}
</style>

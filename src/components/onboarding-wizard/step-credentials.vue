<template>
  <div class="step-credentials">
    <!-- quick 模式：根据域名推断 adapter，给提示 -->
    <a-alert v-if="quick && inferredAdapter" type="info" class="inferred-hint">
      {{ t('onboarding.adapterInferred', { adapter: inferredAdapter }) }}
    </a-alert>

    <a-form :model="provider" layout="vertical">
      <!-- 自定义模式：显式 Provider 名称 / 显示名 -->
      <template v-if="!quick">
        <a-grid :cols="24" :col-gap="16" :row-gap="0">
          <a-grid-item :span="12">
            <a-form-item field="name" :label="t('onboarding.providerName')" required>
              <a-input
                v-model="provider.name"
                :placeholder="t('onboarding.providerNamePlaceholder')"
                @input="onNameManual"
              />
              <template #extra>
                <span class="hint">{{ t('onboarding.providerNameHint') }}</span>
              </template>
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="display_name" :label="t('onboarding.displayName')">
              <a-input
                v-model="provider.display_name"
                :placeholder="t('onboarding.displayNamePlaceholder')"
              />
            </a-form-item>
          </a-grid-item>
        </a-grid>
      </template>

      <a-form-item field="base_url" :label="t('onboarding.baseUrl')" :required="needsUrl">
        <a-input
          v-model="provider.base_url"
          :placeholder="t('onboarding.baseUrlPlaceholder')"
          allow-clear
          @input="onUrlInput"
        />
      </a-form-item>

      <a-form-item
        v-if="needsKey"
        field="api_key"
        :label="t('onboarding.apiKey')"
        :required="needsKey"
      >
        <a-input-password
          v-model="provider.api_key"
          :placeholder="t('onboarding.apiKeyPlaceholder')"
          allow-clear
        />
        <template #extra>
          <span class="hint">{{ t('onboarding.apiKeyHint') }}</span>
        </template>
      </a-form-item>
    </a-form>

    <div class="probe-row">
      <a-button type="primary" :loading="probing" :disabled="!canProbe" @click="runProbe">
        {{ probing ? t('onboarding.probing') : t('onboarding.probe') }}
      </a-button>
      <!-- 探测结果 -->
      <span v-if="probeResult?.success" class="probe-ok">
        {{
          probeResult.models_supported
            ? t('onboarding.probeOk', { ms: probeResult.latency_ms ?? 0 })
            : t('onboarding.probeOkNoModels')
        }}
      </span>
      <span v-else-if="probeError" class="probe-fail">
        {{ t('onboarding.probeFail') }}：{{ probeError }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { OnboardingWizardKey, deriveProviderName } from '@/composables/use-onboarding-wizard'

defineProps<{ quick?: boolean }>()

const { t } = useI18n()
const w = inject(OnboardingWizardKey)!
const { provider, inferredAdapter, probeResult, probeError, probing, adapters, runProbe } = w

const needsUrl = computed(() => {
  if (adapters.value.length === 0) return true
  const a = adapters.value.find((x) => x.type === provider.adapter_type)
  return a ? a.needs_base_url : true
})
const needsKey = computed(() => {
  if (adapters.value.length === 0) return true
  const a = adapters.value.find((x) => x.type === provider.adapter_type)
  return a ? a.needs_api_key : true
})

const canProbe = computed(() => !!provider.adapter_type && (!needsUrl.value || !!provider.base_url))

// 名称自动派生：用户未手动改过时，跟随 base_url 域名
const nameTouched = ref(false)
function onNameManual() {
  nameTouched.value = true
}
function onUrlInput() {
  // quick 模式：根据域名同步 adapter 推断（仅当用户未手动改 adapter 时——quick 不暴露手动改，直接采用）
  if (inferredAdapter.value) provider.adapter_type = inferredAdapter.value
  if (nameTouched.value) return
  const derived = deriveProviderName(provider.base_url)
  if (derived) {
    provider.name = derived
    if (!provider.display_name) provider.display_name = derived
  }
}

// 探测成功后，若名称仍空，补一次派生
watch(
  () => probeResult.value?.success,
  (ok) => {
    if (ok && !provider.name) {
      const derived = deriveProviderName(provider.base_url)
      if (derived) {
        provider.name = derived
        if (!provider.display_name) provider.display_name = derived
      }
    }
  },
)
</script>

<style scoped lang="less">
.inferred-hint {
  margin-bottom: 16px;
}
.hint {
  color: var(--color-text-3);
  font-size: 12px;
}
.probe-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.probe-ok {
  color: rgb(var(--success-6));
  font-size: 13px;
}
.probe-fail {
  color: rgb(var(--danger-6));
  font-size: 13px;
}
</style>

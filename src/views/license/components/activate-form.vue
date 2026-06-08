<template>
  <a-card class="general-card" :title="t('license.activate')">
    <p class="form-desc">{{ t('license.activateDesc') }}</p>
    <a-form :model="form" layout="vertical" @submit-success="handleSubmit">
      <a-form-item
        field="licenseKey"
        :label="t('license.licenseKey')"
        :rules="[{ required: true, message: t('license.licenseKeyRequired') }]"
      >
        <a-input
          v-model="form.licenseKey"
          :placeholder="t('license.licenseKeyPlaceholder')"
          allow-clear
        />
      </a-form-item>
      <a-button type="primary" html-type="submit" :loading="loading">
        {{ loading ? t('license.activating') : t('license.activateButton') }}
      </a-button>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'activate', licenseKey: string): void
}>()

const { t } = useI18n()

const form = reactive({
  licenseKey: '',
})

function handleSubmit() {
  if (form.licenseKey.trim()) {
    emit('activate', form.licenseKey.trim())
  }
}
</script>

<style scoped lang="less">
.form-desc {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--color-text-3);
}
</style>

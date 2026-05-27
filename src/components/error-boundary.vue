<template>
  <slot v-if="!error" />
  <div v-else class="error-boundary">
    <a-result status="error" :title="t('errorBoundary.title')" :subtitle="t('errorBoundary.subtitle')">
      <template #extra>
        <a-button type="primary" @click="reset">{{ t('errorBoundary.retry') }}</a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import { logger } from '@/logger'

const { t } = useI18n()
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err
  logger.error('Component Error', { error: err })
  return false
})

function reset() {
  error.value = null
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
</style>

<template>
  <div class="not-found">
    <a-result status="404" :subtitle="t('notFound.subtitle')">
      <template #extra>
        <a-button type="primary" @click="$router.push('/')">{{ t('notFound.backHome') }}</a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>

<template>
  <div class="page-card-title">
    <div class="page-card-title__text">{{ title }}</div>
    <div v-if="subtitle" class="page-card-title__subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<style scoped lang="less">
.page-card-title {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__text {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    color: var(--color-text-1);
  }

  &__subtitle {
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text-3);
  }
}
</style>

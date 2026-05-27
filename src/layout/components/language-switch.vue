<template>
  <a-dropdown trigger="hover" @select="onSelect">
    <a-button type="text" size="small">
      <icon-language />
      <icon-down />
    </a-button>
    <template #content>
      <a-doption value="zh-CN" :class="{ 'lang-active': currentLocale === 'zh-CN' }">
        简体中文
      </a-doption>
      <a-doption value="en-US" :class="{ 'lang-active': currentLocale === 'en-US' }">
        English
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
defineProps<{
  currentLocale: string
}>()

const emit = defineEmits<{
  change: [lang: string]
}>()

function onSelect(value: string | number | boolean | Record<string, unknown> | undefined) {
  emit('change', String(value))
}
</script>

<style scoped lang="less">
.lang-active {
  font-weight: 600;
}
</style>

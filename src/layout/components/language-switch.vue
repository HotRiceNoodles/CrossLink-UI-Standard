<template>
  <a-dropdown trigger="hover" @select="onSelect">
    <a-button type="text" size="small">
      <icon-language />
      <icon-down />
    </a-button>
    <template #content>
      <a-doption
        v-for="loc in availableLocales"
        :key="loc.value"
        :value="loc.value"
        :class="{ 'lang-active': currentLocale === loc.value }"
      >
        {{ loc.label }}
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { availableLocales } from '@/locale'

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

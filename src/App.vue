<template>
  <a-config-provider :locale="arcoLocale">
    <error-boundary>
      <router-view />
    </error-boundary>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import arcoZhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import arcoEnUS from '@arco-design/web-vue/es/locale/lang/en-us'
import arcoArEG from '@arco-design/web-vue/es/locale/lang/ar-eg'
import ErrorBoundary from '@/components/error-boundary.vue'

const { locale } = useI18n()

const arcoLocale = computed(() => {
  if (locale.value === 'en-US') return arcoEnUS
  if (locale.value === 'ar-EG') return arcoArEG
  return arcoZhCN
})
</script>

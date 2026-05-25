<template>
  <a-card class="general-card banner-card">
    <div class="banner-content">
      <div class="banner-left">
        <h1 class="banner-title">{{ t('dashboard.welcomeBack', { name: displayName }) }}</h1>
        <p class="banner-subtitle">
          <a-tag v-if="tier" color="arcoblue" size="small">{{ tierLabel }}</a-tag>
          <span v-if="version" class="banner-version">v{{ version }}</span>
        </p>
      </div>
      <div class="banner-right">
        <span class="banner-date">{{ currentDate }}</span>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'

const { t } = useI18n()

const userStore = useUserStore()

const props = defineProps<{
  version?: string
  tier?: string
}>()

const displayName = computed(() => userStore.user?.display_name || userStore.user?.username || t('dashboard.admin'))

const tierLabel = computed(() => {
  const map: Record<string, string> = {
    community: t('tier.community'),
    pro: t('tier.pro'),
    enterprise: t('tier.enterprise'),
  }
  return map[props.tier || 'community'] || props.tier || t('tier.community')
})

const currentDate = computed(() => {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekDay = t(`dashboard.weekDays.${now.getDay()}`)
  return t('dashboard.dateTemplate', { year, month, day, weekday: weekDay })
})
</script>

<style scoped lang="less">
.banner-card {
  margin-bottom: 16px;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.banner-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
  line-height: 1.4;
}

.banner-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-3);
  margin: 0;
}

.banner-version {
  color: var(--color-text-3);
}

.banner-right {
  flex-shrink: 0;
}

.banner-date {
  font-size: 14px;
  color: var(--color-text-2);
}
</style>

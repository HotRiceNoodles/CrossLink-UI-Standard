<template>
  <div class="dash-greeting">
    <h1 class="greeting-title">
      {{ t('dashboard.welcomeBack', { name: displayName }) }}
      <a-tag v-if="tier" color="arcoblue" size="small">{{ tierLabel }}</a-tag>
      <span v-if="version" class="greeting-version">v{{ version }}</span>
    </h1>
    <p class="greeting-date">{{ currentDate }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'
import { useTierLabel } from '@/utils/license'

const { t } = useI18n()

const userStore = useUserStore()
const tierLabelFn = useTierLabel()

const props = defineProps<{
  version?: string
  tier?: string
}>()

const displayName = computed(
  () => userStore.user?.display_name || userStore.user?.username || t('dashboard.admin'),
)

const tierLabel = computed(() => tierLabelFn(props.tier || 'community'))

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
// 无卡片的紧凑页头：标题行内联徽标与版本，日期小字次行，右邻时间范围切换器
.dash-greeting {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.greeting-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
  line-height: 1.4;
}

.greeting-version {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-3);
}

// 页头直接落在灰底上（无卡片），用 text-3 保证与背景的可读对比度
.greeting-date {
  font-size: 12px;
  color: var(--color-text-3);
  margin: 0;
}
</style>

<template>
  <div class="global-dashboard">
    <!-- Header -->
    <div class="global-dashboard__header">
      <div>
        <h2 class="global-dashboard__title">{{ t('globalDashboard.title') }}</h2>
        <p class="global-dashboard__subtitle">
          {{ t('globalDashboard.subtitle', { name: userStore.user?.display_name || '' }) }}
        </p>
      </div>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <!-- KPI Stats Bar — 6 metrics -->
      <div class="global-dashboard__stats">
        <div class="global-dashboard__stat-item">
          <div class="global-dashboard__stat-icon global-dashboard__stat-icon--blue">
            <icon-public />
          </div>
          <div class="global-dashboard__stat-info">
            <span class="global-dashboard__stat-value">{{ displayOrgCount }}</span>
            <span class="global-dashboard__stat-label">{{ t('globalDashboard.statOrgs') }}</span>
          </div>
        </div>
        <div class="global-dashboard__stat-item">
          <div class="global-dashboard__stat-icon global-dashboard__stat-icon--green">
            <icon-user-group />
          </div>
          <div class="global-dashboard__stat-info">
            <span class="global-dashboard__stat-value">{{ displayMemberCount }}</span>
            <span class="global-dashboard__stat-label">{{ t('globalDashboard.statMembers') }}</span>
          </div>
        </div>
        <div class="global-dashboard__stat-item">
          <div class="global-dashboard__stat-icon global-dashboard__stat-icon--orange">
            <icon-lock />
          </div>
          <div class="global-dashboard__stat-info">
            <span class="global-dashboard__stat-value">{{ displayKeyCount }}</span>
            <span class="global-dashboard__stat-label">{{ t('globalDashboard.statKeys') }}</span>
          </div>
        </div>
        <div class="global-dashboard__stat-item">
          <div class="global-dashboard__stat-icon global-dashboard__stat-icon--cyan">
            <icon-bar-chart />
          </div>
          <div class="global-dashboard__stat-info">
            <span class="global-dashboard__stat-value">
              {{ formatNumber(usageStats.total_requests) }}
            </span>
            <span class="global-dashboard__stat-label">
              {{ t('globalDashboard.statRequests') }}
            </span>
          </div>
        </div>
        <div class="global-dashboard__stat-item">
          <div class="global-dashboard__stat-icon global-dashboard__stat-icon--red">
            <icon-storage />
          </div>
          <div class="global-dashboard__stat-info">
            <span class="global-dashboard__stat-value">
              {{ currencySymbol }}{{ formatCost(usageStats.total_cost) }}
            </span>
            <span class="global-dashboard__stat-label">{{ t('globalDashboard.statCost') }}</span>
          </div>
        </div>
        <div class="global-dashboard__stat-item">
          <div class="global-dashboard__stat-icon global-dashboard__stat-icon--purple">
            <icon-code />
          </div>
          <div class="global-dashboard__stat-info">
            <span class="global-dashboard__stat-value">
              {{ formatTokens(usageStats.total_tokens) }}
            </span>
            <span class="global-dashboard__stat-label">{{ t('globalDashboard.statTokens') }}</span>
          </div>
        </div>
      </div>

      <!-- Trend Chart -->
      <a-card
        v-if="dailyTrend.length"
        class="general-card global-dashboard__chart-card"
        :title="t('globalDashboard.trendTitle')"
        :bordered="false"
      >
        <TrendChart :data="dailyTrend" />
      </a-card>

      <!-- Empty State -->
      <a-empty v-if="!loading && !orgs.length" class="global-dashboard__empty">
        <template #image>
          <icon-public :size="64" />
        </template>
        <div class="global-dashboard__empty-title">{{ t('globalDashboard.emptyTitle') }}</div>
        <div class="global-dashboard__empty-desc">{{ t('globalDashboard.emptyDesc') }}</div>
        <a-button type="primary" @click="router.push({ name: 'globalOrganizations' })">
          <template #icon><icon-plus /></template>
          {{ t('globalDashboard.createFirst') }}
        </a-button>
      </a-empty>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'
import { orgApi } from '@/api/rbac'
import { usageApi } from '@/api/usage'
import type { Organization, UsageStats, DailyTrend } from '@/types'
import TrendChart from '@/views/dashboard/components/trend-chart.vue'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)

// Org data — used as primary source for org/member/key counts
const orgs = ref<Organization[]>([])

// Usage data
const usageStats = ref<UsageStats>({
  total_requests: 0,
  total_tokens: 0,
  total_cost: 0,
  avg_latency_ms: 0,
  cost_by_currency: {},
})
const dailyTrend = ref<DailyTrend[]>([])

// Display values: prefer stats API fields, fallback to org list computation
const displayOrgCount = computed(() => usageStats.value.organization_count ?? orgs.value.length)

const displayMemberCount = computed(
  () =>
    usageStats.value.member_count ?? orgs.value.reduce((sum, o) => sum + (o.member_count ?? 0), 0),
)

const displayKeyCount = computed(
  () =>
    usageStats.value.total_api_keys ?? orgs.value.reduce((sum, o) => sum + (o.key_count ?? 0), 0),
)

const currencySymbol = computed(() => {
  const currencies = Object.keys(usageStats.value.cost_by_currency || {})
  if (currencies.length === 0) return '¥'
  const map: Record<string, string> = { USD: '$', CNY: '¥', EUR: '€', GBP: '£' }
  const symbol = map[currencies[0]]
  // Use mapped symbol if known, otherwise fallback to ¥
  return symbol || '¥'
})

// Formatters
function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(Math.round(value))
}

function formatCost(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toFixed(2)
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

// Data fetching
async function fetchDashboardData() {
  loading.value = true
  try {
    const [orgsRes, statsRes, dailyRes] = await Promise.allSettled([
      orgApi.list(),
      usageApi.stats(),
      usageApi.daily({ days: 7 }),
    ])

    if (orgsRes.status === 'fulfilled') {
      orgs.value = orgsRes.value.data
    }

    if (statsRes.status === 'fulfilled') {
      usageStats.value = { ...usageStats.value, ...statsRes.value.data }
    }

    if (dailyRes.status === 'fulfilled') {
      dailyTrend.value = dailyRes.value.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped lang="less">
.global-dashboard {
  &__header {
    margin-bottom: 24px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
    margin: 0 0 4px;
  }

  &__subtitle {
    font-size: 14px;
    color: var(--color-text-3);
    margin: 0;
  }

  // KPI Stats Bar
  &__stats {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  &__stat-item {
    background: var(--color-bg-2);
    border: 1px solid var(--color-border-2);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border-color: var(--color-border-3);
    }
  }

  &__stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 20px;

    &--blue {
      background: rgba(22, 93, 255, 0.1);
      color: #165dff;
    }
    &--green {
      background: rgba(0, 180, 42, 0.1);
      color: #00b42a;
    }
    &--orange {
      background: rgba(255, 125, 0, 0.1);
      color: #ff7d00;
    }
    &--cyan {
      background: rgba(15, 198, 194, 0.1);
      color: #0fc6c2;
    }
    &--red {
      background: rgba(245, 63, 63, 0.1);
      color: #f53f3f;
    }
    &--purple {
      background: rgba(114, 46, 209, 0.1);
      color: #722ed1;
    }
  }

  &__stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-1);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__stat-label {
    font-size: 12px;
    color: var(--color-text-3);
    line-height: 1;
    margin-top: 4px;
  }

  // Chart
  &__chart-card {
    margin-bottom: 24px;

    :deep(.arco-card-body) {
      padding-top: 12px;
    }
  }

  // Empty
  &__empty {
    padding: 64px 0;
  }

  &__empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
    margin-top: 12px;
  }

  &__empty-desc {
    font-size: 14px;
    color: var(--color-text-3);
    margin: 4px 0 16px;
  }
}

// Responsive: stack KPI on smaller screens
@media (max-width: 1200px) {
  .global-dashboard__stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .global-dashboard__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

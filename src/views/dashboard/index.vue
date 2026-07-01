<template>
  <div class="dashboard-page">
    <a-spin :loading="loading" style="width: 100%">
      <div class="page-content">
        <!-- Header: welcome banner + time-range toolbar -->
        <div class="dashboard-header">
          <Banner :version="systemInfo?.version" :tier="license?.tier" />
          <div class="range-toolbar">
            <icon-calendar class="range-icon" />
            <span class="range-label">{{ t('dashboard.rangeLabel') }}</span>
            <a-radio-group
              v-model="range"
              type="button"
              size="medium"
              class="range-group"
              @change="onRangeChange"
            >
              <a-radio v-for="opt in RANGE_OPTIONS" :key="opt.value" :value="opt.value">
                {{ t(opt.labelKey) }}
              </a-radio>
            </a-radio-group>
          </div>
        </div>

        <!-- KPI cards (primary + secondary) -->
        <DataPanel
          :stats="usageStats"
          :member-count="memberCount"
          :key-count="keyCount"
          :deltas="kpiDeltas"
          :daily-trend="dailyTrend"
        />

        <!-- Core charts: traffic trend + model distribution -->
        <a-grid :cols="24" :col-gap="16" :row-gap="16" class="chart-section">
          <a-grid-item :span="14">
            <TrendChart :data="dailyTrend" :title="trendTitle" />
          </a-grid-item>
          <a-grid-item :span="10">
            <ModelPie :data="modelDistribution" :title="modelTitle" />
          </a-grid-item>
        </a-grid>

        <!-- Pro: performance + error-rate timeseries (DataLens) -->
        <a-grid
          v-if="userStore.isProOrAbove"
          :cols="24"
          :col-gap="16"
          :row-gap="16"
          class="chart-section"
        >
          <a-grid-item :span="12">
            <PerformanceChart :labels="perfLabels" :latency="perfLatency" :ttft="perfTtft" />
          </a-grid-item>
          <a-grid-item :span="12">
            <ErrorRateChart :labels="errorLabels" :data="errorData" />
          </a-grid-item>
        </a-grid>

        <!-- Top-N breakdowns: models (all tiers) + keys & teams (Pro, DataLens) -->
        <a-grid :cols="24" :col-gap="16" :row-gap="16" class="chart-section">
          <a-grid-item :span="userStore.isProOrAbove ? 8 : 12">
            <TopNTable
              :title="t('dashboard.topModels')"
              :rows="topModels"
              :columns="topNColumnsBar"
              :currency-symbol="currencySymbol"
              badge
            />
          </a-grid-item>
          <template v-if="userStore.isProOrAbove">
            <a-grid-item :span="8">
              <TopNTable
                :title="t('dashboard.topKeys')"
                :rows="topKeys"
                :columns="topNColumns"
                :loading="topNLoading"
                :currency-symbol="currencySymbol"
              />
            </a-grid-item>
            <a-grid-item :span="8">
              <TopNTable
                :title="t('dashboard.topTeams')"
                :rows="topTeams"
                :columns="topNColumns"
                :loading="topNLoading"
                :currency-symbol="currencySymbol"
              />
            </a-grid-item>
          </template>
          <a-grid-item v-if="!userStore.isProOrAbove" :span="12">
            <a-card class="general-card upgrade-card">
              <div class="upgrade-inner">
                <icon-common class="upgrade-icon" />
                <div>
                  <div class="upgrade-title">{{ t('dashboard.upgradeTitle') }}</div>
                  <div class="upgrade-desc">{{ t('dashboard.upgradeDesc') }}</div>
                </div>
              </div>
            </a-card>
          </a-grid-item>
        </a-grid>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useI18n } from 'vue-i18n'
import { usageApi } from '@/api/usage'
import { systemApi } from '@/api/system'
import { licenseApi } from '@/api/license'
import { keyApi } from '@/api/key'
import { authUserApi } from '@/api/rbac'
import { datalensApi, buildTimeseriesQuery, buildTopNQuery } from '@/api/datalens'
import { useLoading } from '@/hooks/loading'
import { useUserStore } from '@/store'
import { useRange, RANGE_OPTIONS } from './composables/use-range'
import { toTimeLabels, toSeries, toTopN, type TopNRow } from './composables/datalens-helpers'
import type {
  UsageStats,
  DailyTrend,
  ModelDistribution,
  SystemInfo as SystemInfoType,
  LicenseStatus,
  DataLensMetricKey,
} from '@/types'
import Banner from './components/banner.vue'
import DataPanel from './components/data-panel.vue'
import TrendChart from './components/trend-chart.vue'
import ModelPie from './components/model-pie.vue'
import PerformanceChart from './components/performance-chart.vue'
import ErrorRateChart from './components/error-rate-chart.vue'
import TopNTable from './components/top-n-table.vue'

// Named so <keep-alive :include="['Dashboard','GlobalDashboard']> can target it.
defineOptions({ name: 'Dashboard' })

const { t } = useI18n()
const userStore = useUserStore()
const { loading, setLoading } = useLoading(true)
const { range, days, dateBounds, prevDateBounds, datalensTimeRange } = useRange('7d')

const usageStats = ref<UsageStats>({
  total_requests: 0,
  total_tokens: 0,
  total_cost: 0,
  avg_latency_ms: 0,
  cost_by_currency: {},
})
const dailyTrend = ref<DailyTrend[]>([])
const modelDistribution = ref<ModelDistribution[]>([])
const systemInfo = ref<SystemInfoType | null>(null)
const license = ref<LicenseStatus | null>(null)
const memberCount = ref<number | null>(null)
const keyCount = ref<number | null>(null)
// previous-period stats for period-over-period deltas (null until fetched)
const prevStats = ref<UsageStats | null>(null)

// — Pro (DataLens) state —
const perfLabels = ref<string[]>([])
const perfLatency = ref<number[]>([])
const perfTtft = ref<number[]>([])
const errorLabels = ref<string[]>([])
const errorData = ref<number[]>([])
const topKeys = ref<TopNRow[]>([])
const topTeams = ref<TopNRow[]>([])
const topNLoading = ref(false)

const TOPN_METRICS: DataLensMetricKey[] = ['requests', 'total_tokens', 'cost']
// keys/teams tables: plain numeric columns (narrow cards)
const topNColumns = computed(() => [
  {
    key: 'requests' as DataLensMetricKey,
    label: t('dashboard.topnRequests'),
    kind: 'number' as const,
  },
  {
    key: 'total_tokens' as DataLensMetricKey,
    label: t('dashboard.topnTokens'),
    kind: 'tokens' as const,
  },
  { key: 'cost' as DataLensMetricKey, label: t('dashboard.topnCost'), kind: 'currency' as const },
])
// models table: token column gets a relative bar for at-a-glance comparison
const topNColumnsBar = computed(() => [
  {
    key: 'requests' as DataLensMetricKey,
    label: t('dashboard.topnRequests'),
    kind: 'number' as const,
  },
  {
    key: 'total_tokens' as DataLensMetricKey,
    label: t('dashboard.topnTokens'),
    kind: 'bar' as const,
  },
  { key: 'cost' as DataLensMetricKey, label: t('dashboard.topnCost'), kind: 'currency' as const },
])

// Top models is derived from the always-available /usage/models payload,
// so it shows for every tier (no DataLens required).
const topModels = computed<TopNRow[]>(() =>
  modelDistribution.value.map((m) => ({
    name: m.model,
    values: { requests: m.count, total_tokens: m.tokens, cost: m.cost },
  })),
)

const currencySymbol = computed(() => {
  const cur = usageStats.value.currency
  const map: Record<string, string> = { USD: '$', CNY: '¥', EUR: '€', GBP: '£' }
  if (cur && map[cur]) return map[cur]
  const currencies = Object.keys(usageStats.value.cost_by_currency || {})
  return currencies.length ? map[currencies[0]] || currencies[0] : '$'
})

const rangeLabel = computed(() =>
  t(RANGE_OPTIONS.find((o) => o.value === range.value)?.labelKey ?? ''),
)
const trendTitle = computed(() => `${t('dashboard.requestTrend')} · ${rangeLabel.value}`)
const modelTitle = computed(() => `${t('dashboard.modelDistribution')} · ${rangeLabel.value}`)

/** % change vs previous period; undefined when prev is missing/zero (avoid misleading ∞). */
function pctDelta(cur: number, prev: number | undefined): number | undefined {
  if (prev === undefined || prev === 0) return undefined
  return ((cur - prev) / prev) * 100
}
const kpiDeltas = computed(() => ({
  requests: pctDelta(usageStats.value.total_requests, prevStats.value?.total_requests),
  cost: pctDelta(usageStats.value.total_cost, prevStats.value?.total_cost),
  tokens: pctDelta(usageStats.value.total_tokens, prevStats.value?.total_tokens),
  latency: pctDelta(usageStats.value.avg_latency_ms, prevStats.value?.avg_latency_ms),
}))

function onRangeChange() {
  fetchDashboardData()
}

async function fetchCore() {
  const [statsRes, prevStatsRes, dailyRes, modelsRes, sysRes, licRes, keysRes, usersRes] =
    await Promise.allSettled([
      usageApi.stats({ ...dateBounds.value }),
      usageApi.stats({ ...prevDateBounds.value }),
      usageApi.daily({ days: days.value }),
      usageApi.models({ days: days.value }),
      systemApi.info(),
      licenseApi.status(),
      keyApi.list(),
      authUserApi.list(),
    ])

  if (statsRes.status === 'fulfilled') usageStats.value = statsRes.value.data
  prevStats.value = prevStatsRes.status === 'fulfilled' ? prevStatsRes.value.data : null
  if (dailyRes.status === 'fulfilled') dailyTrend.value = dailyRes.value.data
  if (modelsRes.status === 'fulfilled') modelDistribution.value = modelsRes.value.data
  if (sysRes.status === 'fulfilled') systemInfo.value = sysRes.value.data
  if (licRes.status === 'fulfilled') license.value = licRes.value.data
  keyCount.value = keysRes.status === 'fulfilled' ? keysRes.value.data.length : null
  memberCount.value = usersRes.status === 'fulfilled' ? usersRes.value.data.length : null
}

async function fetchDataLens() {
  if (!userStore.isProOrAbove) return
  topNLoading.value = true
  try {
    const tr = datalensTimeRange.value
    const [perfRes, errorRes, keysRes, teamsRes] = await Promise.allSettled([
      datalensApi.query(buildTimeseriesQuery(['avg_latency', 'avg_ttft'], tr)),
      datalensApi.query(buildTimeseriesQuery(['error_rate'], tr)),
      datalensApi.query(buildTopNQuery('key', TOPN_METRICS, tr, 'cost', 10)),
      datalensApi.query(buildTopNQuery('team', TOPN_METRICS, tr, 'cost', 10)),
    ])

    if (perfRes.status === 'fulfilled') {
      const rows = perfRes.value.data.rows
      perfLabels.value = toTimeLabels(rows)
      perfLatency.value = toSeries(rows, 'avg_latency')
      perfTtft.value = toSeries(rows, 'avg_ttft')
    }
    if (errorRes.status === 'fulfilled') {
      const rows = errorRes.value.data.rows
      errorLabels.value = toTimeLabels(rows)
      errorData.value = toSeries(rows, 'error_rate').map((v) => v * 100)
    }
    if (keysRes.status === 'fulfilled') {
      topKeys.value = toTopN(keysRes.value.data, 'key', TOPN_METRICS)
    }
    if (teamsRes.status === 'fulfilled') {
      topTeams.value = toTopN(teamsRes.value.data, 'team', TOPN_METRICS)
    }
  } finally {
    topNLoading.value = false
  }
}

async function fetchDashboardData() {
  setLoading(true)
  // Reset DataLens charts so a range switch doesn't briefly show stale series.
  perfLabels.value = []
  perfLatency.value = []
  perfTtft.value = []
  errorLabels.value = []
  errorData.value = []
  try {
    await fetchCore()
  } finally {
    setLoading(false)
  }
  // DataLens loads in the background; sections render their own loading/empty state.
  fetchDataLens()
}

onMounted(() => {
  fetchDashboardData()
})

// keep-alive refresh: re-fetch on reactivation so cached data doesn't go stale.
onActivated(() => {
  fetchDashboardData()
})
</script>

<style scoped lang="less">
.dashboard-page {
  padding: 0;
}

.page-content {
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  :deep(.banner-card) {
    flex: 1 1 auto;
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    flex-direction: column;

    .range-selector {
      width: 100%;
    }
  }
}

.range-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 12px;
  margin-top: 4px;
  background-color: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
}

.range-icon {
  font-size: 15px;
  color: var(--color-text-3);
}

.range-label {
  font-size: 13px;
  color: var(--color-text-2);
  margin-right: 2px;
}

.range-group {
  // tighten the segmented control so the whole toolbar reads as one unit
  :deep(.arco-radio-button) {
    padding: 0 12px;
  }
}

.chart-section {
  margin-bottom: 16px;
}

.upgrade-card {
  height: 100%;
}

.upgrade-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
}

.upgrade-icon {
  font-size: 28px;
  color: rgb(var(--orange-6));
  flex-shrink: 0;
}

.upgrade-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
}

.upgrade-desc {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
}
</style>

<template>
  <div class="data-panel">
    <!-- Primary KPIs: the four metrics that matter most at a glance -->
    <a-grid :cols="24" :col-gap="16" :row-gap="16" class="kpi-row">
      <a-grid-item :span="6">
        <KpiCard
          :value="stats.total_requests"
          :label="t('dashboard.totalRequests')"
          icon="icon-eye"
          tone="blue"
          :delta="deltas.requests"
          :sparkline="series.count"
        />
      </a-grid-item>
      <a-grid-item :span="6">
        <KpiCard
          :value="stats.total_cost"
          :label="t('dashboard.totalCost')"
          icon="icon-storage"
          tone="red"
          :precision="2"
          :prefix="currencySymbol"
          :delta="deltas.cost"
          :sparkline="series.cost"
        />
      </a-grid-item>
      <a-grid-item :span="6">
        <KpiCard
          :value="stats.total_tokens"
          :label="t('dashboard.tokenUsage')"
          icon="icon-code"
          tone="purple"
          :format="formatTokensCompact"
          :delta="deltas.tokens"
          :sparkline="series.tokens"
        />
      </a-grid-item>
      <a-grid-item :span="6">
        <KpiCard
          :value="stats.avg_latency_ms"
          :label="t('dashboard.avgLatency')"
          icon="icon-send"
          tone="green"
          :format="formatLatency"
          :delta="deltas.latency"
          :invert-trend="true"
        />
      </a-grid-item>
    </a-grid>

    <!-- Secondary metrics: one wide panel with a dense stat grid, so long
         values (cost-per-1k etc.) never get squeezed by per-card chrome. -->
    <a-card class="general-card secondary-card">
      <div class="stat-grid">
        <div v-for="m in secondaryMetrics" :key="m.label" class="stat-cell">
          <div class="stat-icon" :class="`tone-${m.tone}`">
            <component :is="m.icon" />
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ m.display }}</span>
            <span class="stat-label">{{ m.label }}</span>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from './kpi-card.vue'
import { formatTokensCompact, formatLatency } from '@/utils/format'
import type { UsageStats, DailyTrend } from '@/types'

const { t } = useI18n()

/** Period-over-period deltas (percentage points) for the four primary metrics. */
export interface KpiDeltas {
  requests?: number
  cost?: number
  tokens?: number
  latency?: number
}

const props = withDefaults(
  defineProps<{
    stats: UsageStats
    memberCount: number | null
    keyCount: number | null
    deltas?: KpiDeltas
    dailyTrend?: DailyTrend[]
  }>(),
  {
    deltas: () => ({}),
    dailyTrend: () => [],
  },
)

// sparkline source series derived from the daily trend (no extra API call)
const series = computed(() => ({
  count: props.dailyTrend.map((d) => d.count),
  tokens: props.dailyTrend.map((d) => d.tokens),
  cost: props.dailyTrend.map((d) => d.cost),
}))

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', CNY: '¥', EUR: '€', GBP: '£' }

const currencySymbol = computed(() => {
  const explicit = props.stats.currency
  if (explicit && CURRENCY_SYMBOL[explicit]) return CURRENCY_SYMBOL[explicit]
  const currencies = Object.keys(props.stats.cost_by_currency || {})
  if (currencies.length > 0) return CURRENCY_SYMBOL[currencies[0]] || currencies[0]
  return '$'
})

function fmtNum(v: number | undefined | null): string {
  if (v === undefined || v === null) return '—'
  return v.toLocaleString()
}

function fmtMoney(v: number | undefined | null, fractionDigits = 4): string {
  if (v === undefined || v === null) return '—'
  return `${currencySymbol.value}${v.toFixed(fractionDigits)}`
}

interface SecMetric {
  icon: string
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  label: string
  display: string
}

const secondaryMetrics = computed<SecMetric[]>(() => {
  const s = props.stats
  return [
    {
      icon: 'icon-layers',
      tone: 'blue',
      label: t('dashboard.totalSessions'),
      display: fmtNum(s.total_sessions),
    },
    {
      icon: 'icon-timing',
      tone: 'green',
      label: t('dashboard.firstTokenLatency'),
      display: s.avg_first_token_ms == null ? '—' : formatLatency(s.avg_first_token_ms),
    },
    {
      icon: 'icon-exclamation-circle',
      tone: 'red',
      label: t('dashboard.errorRate'),
      display: `${((s.error_rate ?? 0) * 100).toFixed(2)}%`,
    },
    {
      icon: 'icon-safe',
      tone: 'orange',
      label: t('dashboard.activeKeys'),
      display: fmtNum(s.active_api_keys),
    },
    {
      icon: 'icon-user-group',
      tone: 'blue',
      label: t('dashboard.memberCount'),
      display: fmtNum(props.memberCount),
    },
    {
      icon: 'icon-lock',
      tone: 'orange',
      label: t('dashboard.keyCount'),
      display: fmtNum(props.keyCount),
    },
    {
      icon: 'icon-common',
      tone: 'red',
      label: t('dashboard.costPerRequest'),
      display: fmtMoney(s.cost_per_request),
    },
    {
      icon: 'icon-common',
      tone: 'red',
      label: t('dashboard.costPer1k'),
      display: fmtMoney(s.cost_per_1k_tokens),
    },
  ]
})
</script>

<style scoped lang="less">
.data-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.secondary-card {
  :deep(.arco-card-body) {
    padding: 16px 20px;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;

  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  :deep(.arco-icon) {
    font-size: 18px;
  }
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-4);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// tone → arco palette
.tone-blue {
  background-color: rgba(var(--arcoblue-1), 0.8);
  color: rgb(var(--arcoblue-6));
}
.tone-green {
  background-color: rgba(var(--green-1), 0.8);
  color: rgb(var(--green-6));
}
.tone-orange {
  background-color: rgba(var(--orange-1), 0.8);
  color: rgb(var(--orange-6));
}
.tone-red {
  background-color: rgba(var(--red-1), 0.8);
  color: rgb(var(--red-6));
}
.tone-purple {
  background-color: rgba(var(--purple-1), 0.8);
  color: rgb(var(--purple-6));
}
</style>

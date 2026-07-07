<template>
  <a-grid :cols="24" :col-gap="12" :row-gap="12" class="kpi-grid">
    <!-- Primary KPIs -->
    <a-grid-item v-for="kpi in primary" :key="kpi.key" :span="6">
      <a-card class="general-card kpi-card">
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-value" :title="kpi.raw">{{ kpi.display }}</div>
      </a-card>
    </a-grid-item>

    <!-- Secondary KPIs -->
    <a-grid-item v-for="kpi in secondary" :key="kpi.key" :span="spanSecondary">
      <a-card class="general-card kpi-card kpi-card--secondary">
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-value kpi-value--sm">{{ kpi.display }}</div>
      </a-card>
    </a-grid-item>
  </a-grid>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCurrencySymbol } from '@/utils/currency'
import { formatTokensCompact, formatLatency } from '@/utils/format'
import type { UsageStats } from '@/types'

const props = defineProps<{ stats: UsageStats }>()
const { t } = useI18n()

interface Kpi {
  key: string
  label: string
  display: string
  raw?: string
}

function pct(v: number | undefined): string {
  if (v == null) return '-'
  return `${(v * 100).toFixed(2)}%`
}

const currencySymbol = computed(() => getCurrencySymbol(props.stats.currency))
const secondaryCount = computed(() => secondary.value.length)
// 4 primaries take 24; secondary row splits 24 evenly (max 8 cols → 3 per row)
const spanSecondary = computed(() => {
  const n = secondaryCount.value
  if (n <= 4) return 6
  if (n <= 6) return 4
  return 3
})

const primary = computed<Kpi[]>(() => [
  {
    key: 'requests',
    label: t('usageStat.kpiRequests'),
    display: props.stats.total_requests.toLocaleString(),
    raw: String(props.stats.total_requests),
  },
  {
    key: 'tokens',
    label: t('usageStat.kpiTokens'),
    display: formatTokensCompact(props.stats.total_tokens),
    raw: props.stats.total_tokens.toLocaleString(),
  },
  {
    key: 'cost',
    label: t('usageStat.kpiCost'),
    display: `${currencySymbol.value}${props.stats.total_cost.toFixed(2)}`,
  },
  {
    key: 'latency',
    label: t('usageStat.kpiLatency'),
    display: formatLatency(props.stats.avg_latency_ms),
  },
])

const secondary = computed<Kpi[]>(() => {
  const list: Kpi[] = [
    {
      key: 'input',
      label: t('usageStat.metricInputTokens'),
      display: formatTokensCompact(props.stats.input_tokens ?? 0),
    },
    {
      key: 'output',
      label: t('usageStat.metricOutputTokens'),
      display: formatTokensCompact(props.stats.output_tokens ?? 0),
    },
    {
      key: 'reasoning',
      label: t('usageStat.metricReasoningTokens'),
      display: formatTokensCompact(props.stats.reasoning_tokens ?? 0),
    },
    {
      key: 'cacheRead',
      label: t('usageStat.metricCacheRead'),
      display: formatTokensCompact(props.stats.cache_read_tokens ?? 0),
    },
    {
      key: 'firstToken',
      label: t('usageStat.kpiFirstToken'),
      display: props.stats.avg_first_token_ms ? formatLatency(props.stats.avg_first_token_ms) : '-',
    },
    {
      key: 'errorRate',
      label: t('usageStat.kpiErrorRate'),
      display: pct(props.stats.error_rate),
    },
    {
      key: 'costPer1k',
      label: t('usageStat.kpiCostPer1k'),
      display: `${currencySymbol.value}${(props.stats.cost_per_1k_tokens ?? 0).toFixed(4)}`,
    },
    {
      key: 'fallbackRate',
      label: t('usageStat.kpiFallbackRate'),
      display: pct(props.stats.fallback_rate),
    },
    {
      key: 'retryRate',
      label: t('usageStat.kpiRetryRate'),
      display: pct(props.stats.retry_rate),
    },
  ]
  return list
})
</script>

<style scoped lang="less">
.kpi-card {
  height: 100%;
}

.kpi-label {
  font-size: 12px;
  color: var(--color-text-3);
  line-height: 1;
}

.kpi-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value--sm {
  font-size: 18px;
}

.kpi-card--secondary {
  :deep(.arco-card-body) {
    padding: 12px 16px;
  }
}
</style>

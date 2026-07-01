<template>
  <a-card class="general-card top-n-card">
    <template #title>{{ title }}</template>
    <a-spin :loading="loading" style="width: 100%">
      <a-empty v-if="!loading && !rows.length" :description="t('dashboard.noData')" />
      <div v-else class="top-n-list">
        <div class="top-n-row top-n-head">
          <span class="col-rank">#</span>
          <span class="col-name">{{ t('dashboard.topnName') }}</span>
          <span
            v-for="col in columns"
            :key="col.key"
            class="col-metric"
            :class="{ 'col-metric-grow': col.kind === 'bar' }"
          >
            {{ col.label }}
          </span>
        </div>
        <div v-for="(row, idx) in rows" :key="row.name + idx" class="top-n-row">
          <span class="col-rank" :class="{ 'rank-top': idx < 3 }">{{ idx + 1 }}</span>
          <span class="col-name" :title="row.name">
            <span
              v-if="badge"
              class="name-badge"
              :style="{ background: palette[idx % palette.length] }"
            >
              {{ initials(row.name) }}
            </span>
            <span class="name-text">{{ row.name }}</span>
          </span>
          <span
            v-for="col in columns"
            :key="col.key"
            class="col-metric"
            :class="{ 'col-metric-grow': col.kind === 'bar' }"
          >
            <template v-if="col.kind === 'bar'">
              <span class="bar-num">{{ formatValue(row.values[col.key] ?? 0, 'tokens') }}</span>
              <span class="bar-track">
                <span
                  class="bar-fill"
                  :style="{ width: barPct(col.key, row.values[col.key] ?? 0) + '%' }"
                />
              </span>
            </template>
            <template v-else>
              {{ formatValue(row.values[col.key] ?? 0, col.kind, currencySymbol) }}
            </template>
          </span>
        </div>
      </div>
    </a-spin>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTokensCompact, formatCost } from '@/utils/format'
import type { DataLensMetricKey } from '@/types'
import type { TopNRow } from '../composables/datalens-helpers'

type ColKind = 'number' | 'currency' | 'tokens' | 'bar'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    title: string
    rows: TopNRow[]
    columns: { key: DataLensMetricKey; label: string; kind: ColKind }[]
    loading?: boolean
    currencySymbol?: string
    /** Render a colored initials badge before each name (e.g. model tables). */
    badge?: boolean
  }>(),
  {
    badge: false,
  },
)

// 10-color palette shared in spirit with model-pie.vue
const palette = [
  '#165DFF',
  '#00B42A',
  '#FF7D00',
  '#722ED1',
  '#F53F3F',
  '#0FC6C2',
  '#3491FA',
  '#F77234',
  '#D91AD9',
  '#4CDF48',
]

// max value per bar-column → drives relative bar widths
const barMax = computed<Record<string, number>>(() => {
  const maxes: Record<string, number> = {}
  for (const col of props.columns) {
    if (col.kind !== 'bar') continue
    maxes[col.key] = props.rows.reduce((m, r) => Math.max(m, Number(r.values[col.key] ?? 0)), 0)
  }
  return maxes
})

function barPct(key: string, value: number): number {
  const max = barMax.value[key] || 0
  return max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
}

function initials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '')
  return (clean.slice(0, 2) || name.slice(0, 2)).toUpperCase()
}

function formatValue(v: number, kind: ColKind, currencySymbol = '$') {
  if (kind === 'tokens' || kind === 'bar') return formatTokensCompact(v)
  if (kind === 'currency') return `${currencySymbol}${formatCost(v)}`
  return v.toLocaleString()
}
</script>

<style scoped lang="less">
.top-n-card {
  height: 100%;
}

.top-n-list {
  display: flex;
  flex-direction: column;
}

.top-n-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-fill-2);
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }
}

.top-n-head {
  color: var(--color-text-3);
  font-size: 12px;
  border-bottom: 1px solid var(--color-border-2);
}

.col-rank {
  flex: 0 0 28px;
  text-align: center;
  color: var(--color-text-3);
}

.rank-top {
  color: rgb(var(--orange-6));
  font-weight: 700;
}

.col-name {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-1);
}

.name-badge {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.name-text {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-metric {
  flex: 0 0 auto;
  min-width: 72px;
  text-align: right;
  color: var(--color-text-2);
  font-variant-numeric: tabular-nums;
}

// bar columns take the remaining width and stack number + relative bar
.col-metric-grow {
  flex: 1 1 auto;
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.bar-num {
  flex: 0 0 auto;
  min-width: 48px;
  text-align: right;
}

.bar-track {
  flex: 1 1 auto;
  max-width: 120px;
  height: 6px;
  border-radius: 3px;
  background: var(--color-fill-2);
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, rgb(var(--arcoblue-6)), rgb(var(--purple-6)));
  transition: width 0.3s ease;
}
</style>

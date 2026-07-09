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
            :class="{
              'col-metric-grow': col.kind === 'bar',
              sortable: true,
              'sort-active': sortKey === col.key,
            }"
            @click="toggleSort(col.key)"
          >
            <span class="col-label">{{ col.label }}</span>
            <span v-if="sortKey === col.key" class="sort-arrow">
              {{ sortDir === 'desc' ? '↓' : '↑' }}
            </span>
          </span>
        </div>
        <div
          v-for="(row, idx) in displayRows"
          :key="row.name + idx"
          class="top-n-row"
          :class="{ 'row-clickable': !!drillRoute }"
          :title="drillRoute ? t('dashboard.topnDrillHint') : undefined"
          @click="onRowClick(row)"
        >
          <span class="col-rank" :class="{ 'rank-top': idx < 3 }">{{ idx + 1 }}</span>
          <span class="col-name" :title="row.name">
            <span v-if="badge" class="name-badge" :style="{ background: modelColor(row.name) }">
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
                  :style="barStyle(col.key, row.values[col.key] ?? 0, row.name)"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { formatTokensCompact, formatCost } from '@/utils/format'
import type { DataLensMetricKey } from '@/types'
import type { TopNRow } from '../composables/datalens-helpers'
import { modelColor } from '../composables/model-color'

type ColKind = 'number' | 'currency' | 'tokens' | 'bar'

const { t } = useI18n()
const router = useRouter()

const props = withDefaults(
  defineProps<{
    title: string
    rows: TopNRow[]
    columns: { key: DataLensMetricKey; label: string; kind: ColKind }[]
    loading?: boolean
    currencySymbol?: string
    /** Render a colored initials badge before each name (e.g. model tables). */
    badge?: boolean
    /** When set, rows are clickable and navigate to the given route with the
     *  row name under queryKey (e.g. drill into usage-statistics by model). */
    drillRoute?: { name: string; queryKey: string }
  }>(),
  {
    badge: false,
    drillRoute: undefined,
  },
)

// Client-side column sort. Default (null) = as-passed order (already ranked by
// the parent's primary metric). Clicking a metric header toggles asc/desc.
const sortKey = ref<DataLensMetricKey | null>(null)
const sortDir = ref<'asc' | 'desc'>('desc')

const displayRows = computed<TopNRow[]>(() => {
  if (!sortKey.value) return props.rows
  const key = sortKey.value
  const dir = sortDir.value === 'desc' ? -1 : 1
  return [...props.rows].sort((a, b) => {
    const av = Number(a.values[key] ?? 0)
    const bv = Number(b.values[key] ?? 0)
    return (av - bv) * dir
  })
})

function toggleSort(key: DataLensMetricKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
}

function onRowClick(row: TopNRow) {
  if (!props.drillRoute) return
  router.push({
    name: props.drillRoute.name,
    query: { [props.drillRoute.queryKey]: row.name },
  })
}

// max value per bar-column → drives relative bar widths
const barMax = computed<Record<string, number>>(() => {
  const maxes: Record<string, number> = {}
  for (const col of props.columns) {
    if (col.kind !== 'bar') continue
    maxes[col.key] = displayRows.value.reduce(
      (m, r) => Math.max(m, Number(r.values[col.key] ?? 0)),
      0,
    )
  }
  return maxes
})

function barPct(key: string, value: number): number {
  const max = barMax.value[key] || 0
  return max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
}

// Inline style for a bar fill: relative width, a min sliver so non-zero but
// long-tail values stay visible, and the model color so a row's bar matches
// its badge (and the pie slice for the same model).
function barStyle(key: string, value: number, name: string) {
  const pct = barPct(key, value)
  return {
    width: `${pct}%`,
    minWidth: value > 0 && pct < 4 ? '6px' : '0',
    background: modelColor(name),
  }
}

function initials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '')
  if (clean) return clean.slice(0, 2).toUpperCase()
  // No latin/digit — fall back to leading CJK chars if any, else a neutral mark.
  if (/[一-鿿]/.test(name)) return name.slice(0, 2)
  return '#'
}

function formatValue(v: number, kind: ColKind, currencySymbol = '$') {
  if (kind === 'currency') {
    // Suppress ¥0.00 noise — also covers tiny costs that round to 0.00.
    const formatted = formatCost(v)
    return formatted === '0.00' ? '—' : `${currencySymbol}${formatted}`
  }
  if (kind === 'tokens' || kind === 'bar') {
    return v === 0 ? '—' : formatTokensCompact(v)
  }
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
  // Fixed basis (not content-based) so every row — including the header —
  // resolves the same column width and the columns line up vertically.
  // Bar columns override this via .col-metric-grow.
  flex: 0 0 84px;
  text-align: left;
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
  justify-content: flex-start;
}

.bar-num {
  flex: 0 0 auto;
  min-width: 48px;
  text-align: left;
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
  // background set inline per-row (model color); keep a fallback for safety
  background: rgb(var(--arcoblue-6));
  transition: width 0.3s ease;
}

// Sortable column headers
.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease;

  &:hover {
    color: var(--color-text-1);
  }
}

.sort-active {
  color: rgb(var(--arcoblue-6));
  font-weight: 600;
}

.sort-arrow {
  margin-left: 2px;
}

// Drill-down rows
.row-clickable {
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--color-fill-1);
  }
}
</style>

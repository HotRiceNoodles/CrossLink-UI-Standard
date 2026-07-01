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
            :style="{ textAlign: 'right' }"
          >
            {{ col.label }}
          </span>
        </div>
        <div v-for="(row, idx) in rows" :key="row.name + idx" class="top-n-row">
          <span class="col-rank" :class="{ 'rank-top': idx < 3 }">{{ idx + 1 }}</span>
          <span class="col-name" :title="row.name">{{ row.name }}</span>
          <span v-for="col in columns" :key="col.key" class="col-metric">
            {{ formatValue(row.values[col.key] ?? 0, col.kind, currencySymbol) }}
          </span>
        </div>
      </div>
    </a-spin>
  </a-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatTokensCompact, formatCost } from '@/utils/format'
import type { DataLensMetricKey } from '@/types'
import type { TopNRow } from '../composables/datalens-helpers'

const { t } = useI18n()

defineProps<{
  title: string
  rows: TopNRow[]
  columns: { key: DataLensMetricKey; label: string; kind: 'number' | 'currency' | 'tokens' }[]
  loading?: boolean
  currencySymbol?: string
}>()

function formatValue(v: number, kind: 'number' | 'currency' | 'tokens', currencySymbol = '$') {
  if (kind === 'tokens') return formatTokensCompact(v)
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-1);
}

.col-metric {
  flex: 0 0 auto;
  min-width: 72px;
  text-align: right;
  color: var(--color-text-2);
  font-variant-numeric: tabular-nums;
}
</style>

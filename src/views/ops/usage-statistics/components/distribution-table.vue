<template>
  <a-card class="general-card">
    <template #title>{{ title }}</template>
    <a-table
      :data="rows"
      :pagination="false"
      :scroll="{ y: 320 }"
      size="small"
      :bordered="false"
      row-key="name"
    >
      <template #columns>
        <a-table-column :title="nameLabel" data-index="name" :ellipsis="true" :tooltip="true">
          <template #cell="{ record }">
            <span style="font-weight: 600">{{ record.name }}</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('usageStat.colRequests')" align="right" :width="110">
          <template #cell="{ record }">
            <span class="num">{{ record.requests.toLocaleString() }}</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('usageStat.colTokens')" align="right" :width="120">
          <template #cell="{ record }">
            <span class="num">{{ formatTokensCompact(record.tokens) }}</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('usageStat.colCost')" align="right" :width="120">
          <template #cell="{ record }">
            <span class="num cost">{{ symbol }}{{ record.cost.toFixed(2) }}</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('usageStat.colShare')" align="right" :width="90">
          <template #cell="{ record }">
            <span class="num muted">{{ shareOf(record.requests) }}</span>
          </template>
        </a-table-column>
      </template>
      <template #empty>
        <div class="empty">{{ t('usageStat.empty') }}</div>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCurrencySymbol } from '@/utils/currency'
import { formatTokensCompact } from '@/utils/format'

interface DistRow {
  name: string
  requests: number
  tokens: number
  cost: number
}

const props = withDefaults(
  defineProps<{
    title: string
    rows: DistRow[]
    nameLabel?: string
    currency?: string
  }>(),
  { nameLabel: '', currency: '' },
)

const { t } = useI18n()
const symbol = computed(() => getCurrencySymbol(props.currency))

const totalRequests = computed(() => props.rows.reduce((sum, r) => sum + (r.requests || 0), 0))
function shareOf(n: number): string {
  if (!totalRequests.value) return '-'
  return `${((n / totalRequests.value) * 100).toFixed(1)}%`
}
</script>

<style scoped lang="less">
.num {
  font-variant-numeric: tabular-nums;
  color: var(--color-text-2);
}
.cost {
  color: var(--color-text-1);
  font-weight: 500;
}
.muted {
  color: var(--color-text-3);
}
.empty {
  padding: 32px 0;
  color: var(--color-text-4);
  font-size: 13px;
  text-align: center;
}
</style>

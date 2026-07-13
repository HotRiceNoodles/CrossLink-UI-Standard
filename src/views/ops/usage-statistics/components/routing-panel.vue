<template>
  <a-card class="general-card">
    <template #title>
      <div class="panel-head">
        <span>{{ t('usageStat.routingTitle') }}</span>
        <a-select
          v-model="selectedModel"
          :placeholder="t('usageStat.routingModelPlaceholder')"
          allow-search
          allow-clear
          size="small"
          style="width: 260px"
          :loading="loading"
          @change="onModelChange"
        >
          <a-option v-for="m in modelOptions" :key="m" :value="m" :label="m" />
        </a-select>
      </div>
    </template>

    <div v-if="!selectedModel" class="placeholder">
      <icon-bar-chart class="placeholder-icon" />
      <p>{{ t('usageStat.routingPlaceholder') }}</p>
    </div>

    <div v-else-if="loading" class="placeholder">
      <a-spin />
    </div>

    <div v-else-if="forbidden" class="placeholder">
      <icon-lock class="placeholder-icon" />
      <p>{{ t('usageStat.routingForbidden') }}</p>
    </div>

    <div v-else-if="!rows.length" class="placeholder">
      <icon-empty class="placeholder-icon" />
      <p>{{ t('usageStat.empty') }}</p>
    </div>

    <a-table
      v-else
      :data="rows"
      :pagination="false"
      size="small"
      :bordered="false"
      row-key="provider_id"
    >
      <template #columns>
        <a-table-column
          :title="t('ops.provider')"
          data-index="provider_name"
          :width="140"
          :ellipsis="true"
          :tooltip="true"
        >
          <template #cell="{ record }">
            <span style="font-weight: 600">
              {{ record.provider_name || `#${record.provider_id}` }}
            </span>
          </template>
        </a-table-column>

        <a-table-column :title="t('usageStat.colConfigWeight')" :width="170">
          <template #cell="{ record }">
            <div class="bar-cell">
              <div class="bar-track">
                <div
                  class="bar-fill bar-config"
                  :style="{ width: pctOf(record.config_weight_pct) }"
                />
              </div>
              <span class="bar-text">{{ pctOf(record.config_weight_pct) }}</span>
            </div>
          </template>
        </a-table-column>

        <a-table-column :title="t('usageStat.colActual')" :width="170">
          <template #cell="{ record }">
            <div class="bar-cell">
              <div class="bar-track">
                <div class="bar-fill bar-actual" :style="{ width: pctOf(record.actual_pct) }" />
              </div>
              <span class="bar-text">{{ pctOf(record.actual_pct) }}</span>
            </div>
          </template>
        </a-table-column>

        <a-table-column :title="t('usageStat.colDeviation')" align="right" :width="100">
          <template #cell="{ record }">
            <span class="num" :class="deviationClass(record.deviation)">
              {{ signedPct(record.deviation) }}
            </span>
          </template>
        </a-table-column>

        <a-table-column :title="t('usageStat.colRequests')" align="right" :width="100">
          <template #cell="{ record }">
            <span class="num">{{ record.requests.toLocaleString() }}</span>
          </template>
        </a-table-column>

        <a-table-column :title="t('usageStat.kpiErrorRate')" align="right" :width="90">
          <template #cell="{ record }">
            <span class="num" :class="{ 'err-hi': record.error_rate > 0.05 }">
              {{ pctOf(record.error_rate) }}
            </span>
          </template>
        </a-table-column>

        <a-table-column :title="t('usageStat.kpiLatency')" align="right" :width="90">
          <template #cell="{ record }">
            <span class="num">{{ formatLatency(record.avg_latency_ms) }}</span>
          </template>
        </a-table-column>

        <a-table-column :title="t('usageStat.colCost')" align="right" :width="110">
          <template #cell="{ record }">
            <span class="num cost">{{ symbol }}{{ record.cost.toFixed(4) }}</span>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usageApi } from '@/api/usage'
import { getCurrencySymbol } from '@/utils/currency'
import { formatLatency } from '@/utils/format'
import { logger } from '@/logger'
import type { RoutingStatRow } from '@/types'

const props = defineProps<{
  days: number
  modelOptions: string[]
  currency?: string
  /** 种子模型：父级全局过滤里若选了模型，下钻面板初始就带上它 */
  initialModel?: string
}>()

const { t } = useI18n()
const selectedModel = ref<string | undefined>(props.initialModel)
const rows = ref<RoutingStatRow[]>([])
const loading = ref(false)
const forbidden = ref(false)

const symbol = computed(() => getCurrencySymbol(props.currency))

function pctOf(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}
function signedPct(v: number): string {
  const sign = v > 0 ? '+' : ''
  return `${sign}${(v * 100).toFixed(1)}%`
}
function deviationClass(v: number): string {
  if (Math.abs(v) < 0.03) return 'muted'
  return v > 0 ? 'dev-pos' : 'dev-neg'
}

function onModelChange() {
  if (selectedModel.value) fetchRouting()
  else rows.value = []
}

async function fetchRouting() {
  if (!selectedModel.value) return
  loading.value = true
  forbidden.value = false
  try {
    const res = await usageApi.routingStats({ model: selectedModel.value, days: props.days })
    rows.value = res?.providers ?? []
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status
    if (status === 403) {
      forbidden.value = true
      rows.value = []
    } else {
      logger.warn('Failed to load routing stats', e, 'app')
    }
  } finally {
    loading.value = false
  }
}

// 切换时间范围（days 变化）时，已选模型则重新拉取
watch(
  () => props.days,
  () => {
    if (selectedModel.value) fetchRouting()
  },
)

// 种子模型延迟生效：等模型列表就绪后，若用户尚未手选，则用 initialModel
watch(
  () => props.initialModel,
  (m) => {
    if (!selectedModel.value && m) {
      selectedModel.value = m
      fetchRouting()
    }
  },
)
</script>

<style scoped lang="less">
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.placeholder {
  padding: 40px 0;
  text-align: center;
  color: var(--color-text-4);

  .placeholder-icon {
    font-size: 32px;
    opacity: 0.4;
    display: block;
    margin: 0 auto 8px;
  }

  p {
    margin: 0;
    font-size: 13px;
  }
}

.bar-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-track {
  flex: 1;
  height: 6px;
  background: var(--color-fill-2);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;

  &.bar-config {
    background: rgb(var(--gray-5));
  }

  &.bar-actual {
    background: #165dff;
  }
}

.bar-text {
  font-size: 12px;
  color: var(--color-text-2);
  font-variant-numeric: tabular-nums;
  min-width: 42px;
  text-align: end;
}

.num {
  font-variant-numeric: tabular-nums;
  color: var(--color-text-2);

  &.cost {
    color: var(--color-text-1);
    font-weight: 500;
  }

  &.muted {
    color: var(--color-text-3);
  }

  &.dev-pos {
    color: rgb(var(--green-6));
  }

  &.dev-neg {
    color: rgb(var(--red-6));
  }

  &.err-hi {
    color: rgb(var(--red-6));
    font-weight: 600;
  }
}
</style>

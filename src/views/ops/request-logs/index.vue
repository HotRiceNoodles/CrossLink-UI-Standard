<template>
  <div class="request-logs-page">
    <a-card class="general-card">
      <template #title>
        <span class="page-title">{{ t('ops.requestLogs') }}</span>
      </template>

      <!-- Basic Filters -->
      <div class="filter-area">
        <a-row :gutter="12" align="center">
          <a-col :span="7">
            <div class="filter-item">
              <label class="filter-label">{{ t('ops.dateRange') }}</label>
              <a-range-picker
                v-model="dateRange"
                style="width: 100%"
                format="YYYY-MM-DD"
                @change="onDateRangeChange"
              />
            </div>
          </a-col>
          <a-col :span="4">
            <div class="filter-item">
              <label class="filter-label">{{ t('ops.statusCode') }}</label>
              <a-select
                v-model="filter.status"
                :placeholder="t('common.all')"
                allow-clear
                style="width: 100%"
              >
                <a-option value="2xx" label="2xx" />
                <a-option value="4xx" label="4xx" />
                <a-option value="5xx" label="5xx" />
                <a-option value="429" label="429" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="5">
            <div class="filter-item">
              <label class="filter-label">{{ t('ops.model') }}</label>
              <a-select
                v-model="filter.model"
                :placeholder="t('common.all')"
                allow-search
                allow-clear
                style="width: 100%"
              >
                <a-option v-for="m in modelOptions" :key="m" :value="m" :label="m" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="filter-item filter-actions">
              <label class="filter-label">&nbsp;</label>
              <a-space>
                <a-button type="primary" @click="applyFilter">{{ t('common.search') }}</a-button>
                <a-button @click="resetFilter">{{ t('common.reset') }}</a-button>
                <a-link @click="advancedVisible = !advancedVisible">
                  {{ advancedVisible ? t('ops.collapseFilter') : t('ops.advancedFilter') }}
                  <template #icon>
                    <icon-up v-if="advancedVisible" />
                    <icon-down v-else />
                  </template>
                </a-link>
              </a-space>
            </div>
          </a-col>
        </a-row>

        <!-- Advanced Filters -->
        <transition name="slide-down">
          <a-row v-if="advancedVisible" :gutter="12" align="center" class="advanced-row">
            <a-col :span="5">
              <div class="filter-item">
                <label class="filter-label">{{ t('ops.provider') }}</label>
                <a-select
                  v-model="filter.provider_id"
                  :placeholder="t('common.all')"
                  allow-clear
                  style="width: 100%"
                >
                  <a-option
                    v-for="p in providerOptions"
                    :key="p.value"
                    :value="p.value"
                    :label="p.label"
                  />
                </a-select>
              </div>
            </a-col>
            <a-col :span="5">
              <div class="filter-item">
                <label class="filter-label">{{ t('ops.apiKey') }}</label>
                <a-select
                  v-model="filter.api_key_id"
                  :placeholder="t('common.all')"
                  allow-clear
                  allow-search
                  style="width: 100%"
                >
                  <a-option
                    v-for="k in keyOptions"
                    :key="k.value"
                    :value="k.value"
                    :label="k.label"
                  />
                </a-select>
              </div>
            </a-col>
            <a-col :span="4">
              <div class="filter-item">
                <label class="filter-label">{{ t('ops.fallback') }}</label>
                <a-select
                  v-model="filter.has_fallback"
                  :placeholder="t('common.all')"
                  allow-clear
                  style="width: 100%"
                >
                  <a-option :value="true" :label="t('common.yes')" />
                  <a-option :value="false" :label="t('common.no')" />
                </a-select>
              </div>
            </a-col>
          </a-row>
        </transition>
      </div>

      <!-- Table -->
      <a-table
        :data="logs"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        row-key="id"
        size="small"
        :bordered="false"
        row-class="clickable-row"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
        @row-click="openDrawer"
      >
        <template #columns>
          <a-table-column :title="t('ops.tableTime')" data-index="created_at" :width="170">
            <template #cell="{ record }">
              <span class="cell-time">{{ formatTime(record.created_at) }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('ops.tableModel')" data-index="model_requested" :width="160">
            <template #cell="{ record }">
              <span class="cell-model">{{ record.model_requested }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('ops.tableModelUsed')" data-index="model_used" :width="160">
            <template #cell="{ record }">
              <span
                class="cell-model-used"
                :class="{
                  'model-mismatch':
                    record.model_used && record.model_used !== record.model_requested,
                }"
              >
                {{ record.model_used || '-' }}
              </span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('ops.tableStatus')"
            data-index="status_code"
            :width="80"
            align="center"
          >
            <template #cell="{ record }">
              <span class="cell-status" :class="'status-' + statusClass(record.status_code)">
                {{ record.status_code }}
              </span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('ops.tableInput')"
            data-index="input_tokens"
            :width="90"
            align="right"
          >
            <template #cell="{ record }">
              <span class="cell-num">{{ formatTokensLocale(record.input_tokens) }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('ops.tableOutput')"
            data-index="output_tokens"
            :width="90"
            align="right"
          >
            <template #cell="{ record }">
              <span class="cell-num">{{ formatTokensLocale(record.output_tokens) }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('ops.tableLatency')"
            data-index="latency_ms"
            :width="80"
            align="right"
          >
            <template #cell="{ record }">
              <span class="cell-latency" :class="latencyClass(record.latency_ms)">
                {{ formatLatency(record.latency_ms) }}
              </span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('ops.tableTtft')"
            data-index="first_token_ms"
            :width="80"
            align="right"
          >
            <template #cell="{ record }">
              <span class="cell-num">
                {{ record.first_token_ms != null ? `${record.first_token_ms}ms` : '-' }}
              </span>
            </template>
          </a-table-column>

          <a-table-column :title="t('ops.tableCost')" data-index="cost" :width="100" align="right">
            <template #cell="{ record }">
              <span class="cell-cost">
                {{ getCurrencySymbol(record.currency)
                }}{{ record.cost != null ? record.cost.toFixed(4) : '-' }}
              </span>
            </template>
          </a-table-column>

          <a-table-column :title="t('ops.tableTags')" :width="120">
            <template #cell="{ record }">
              <template
                v-if="record.fallback_count > 0 || record.cache_hit || record.guardrail_triggered"
              >
                <a-tag v-if="record.fallback_count > 0" color="orangered" size="small">
                  {{ t('ops.tagFallback') }}
                </a-tag>
                <a-tag v-if="record.cache_hit" color="arcoblue" size="small">
                  {{ t('ops.tagCache') }}
                </a-tag>
                <a-tag v-if="record.guardrail_triggered" color="red" size="small">
                  {{ t('ops.tagGuardrail') }}
                </a-tag>
              </template>
              <span v-else class="cell-dash">-</span>
            </template>
          </a-table-column>
        </template>

        <template #empty>
          <div class="empty-state">
            <icon-file class="empty-icon" />
            <p>{{ t('ops.noLogs') }}</p>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- Detail Drawer -->
    <log-detail-drawer
      v-model:visible="drawerVisible"
      :log="currentLog"
      :provider-options="providerOptions"
      :key-options="keyOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { Message } from '@arco-design/web-vue'
import { usageApi } from '@/api/usage'
import { modelApi } from '@/api/model'
import { providerApi } from '@/api/provider'
import { keyApi } from '@/api/key'
import { useLoading } from '@/hooks/loading'
import { formatTime, formatLatency, statusClass, formatTokensLocale } from '@/utils/format'
import { logger } from '@/logger'
import { getCurrencySymbol } from '@/utils/currency'
import LogDetailDrawer from './components/log-detail-drawer.vue'
import type { UsageLog, UsageQuery, Provider, APIKey } from '@/types'

const { t } = useI18n()
const { loading, setLoading } = useLoading()

// Data
const logs = ref<UsageLog[]>([])

// Pagination
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

// Date range (for range-picker binding)
const dateRange = ref<Date[] | undefined>(undefined)

// Filters
const filter = reactive({
  start_date: undefined as string | undefined,
  end_date: undefined as string | undefined,
  status: undefined as string | undefined,
  model: undefined as string | undefined,
  provider_id: undefined as number | undefined,
  api_key_id: undefined as number | undefined,
  has_fallback: undefined as boolean | undefined,
})

const advancedVisible = ref(false)

// Drawer
const drawerVisible = ref(false)
const currentLog = ref<UsageLog | null>(null)

// Select options
const modelOptions = ref<string[]>([])
const providerOptions = ref<{ label: string; value: number }[]>([])
const keyOptions = ref<{ label: string; value: number }[]>([])

// Build query params from filter state
function buildQuery(): UsageQuery {
  const query: UsageQuery = {
    page: pagination.current,
    page_size: pagination.pageSize,
  }
  if (filter.start_date) query.start_date = filter.start_date
  if (filter.end_date) query.end_date = filter.end_date
  if (filter.status) query.status = filter.status
  if (filter.model) query.model = filter.model
  if (filter.provider_id != null) query.provider_id = filter.provider_id
  if (filter.api_key_id != null) query.api_key_id = filter.api_key_id
  if (filter.has_fallback != null) query.has_fallback = filter.has_fallback
  return query
}

// Fetch data
async function fetchData() {
  setLoading(true)
  try {
    const res = await usageApi.requestLogs(buildQuery())
    logs.value = res.data ?? []
    if (res.pagination) {
      pagination.total = res.pagination.total
    } else {
      pagination.total = 0
    }
  } catch {
    Message.error(t('ops.fetchLogsFail'))
  } finally {
    setLoading(false)
  }
}

// Load filter options in parallel
async function loadFilterOptions() {
  try {
    const [modelsRes, providersRes, keysRes] = await Promise.all([
      modelApi.list(),
      providerApi.list(),
      keyApi.list(),
    ])

    // Extract unique model names
    const modelSet = new Set<string>()
    for (const m of modelsRes.data ?? []) {
      if (m.model_name) modelSet.add(m.model_name)
    }
    modelOptions.value = Array.from(modelSet).sort()

    // Map providers
    providerOptions.value = ((providersRes.data as Provider[]) ?? []).map((p) => ({
      label: p.display_name || p.name,
      value: p.id,
    }))

    // Map keys
    keyOptions.value = ((keysRes.data as APIKey[]) ?? []).map((k) => ({
      label: k.name,
      value: k.id,
    }))
  } catch (e) {
    // Non-critical: filter options are best-effort, but surface the failure in the debug log.
    logger.warn('Failed to load request-log filter options', e, 'app')
  }
}

// Date range change handler
function onDateRangeChange(values: Date[] | undefined) {
  if (values && values.length === 2) {
    filter.start_date = dayjs(values[0]).format('YYYY-MM-DD')
    filter.end_date = dayjs(values[1]).format('YYYY-MM-DD')
  } else {
    filter.start_date = undefined
    filter.end_date = undefined
  }
}

// Filter actions
function applyFilter() {
  pagination.current = 1
  fetchData()
}

function resetFilter() {
  dateRange.value = undefined
  filter.start_date = undefined
  filter.end_date = undefined
  filter.status = undefined
  filter.model = undefined
  filter.provider_id = undefined
  filter.api_key_id = undefined
  filter.has_fallback = undefined
  pagination.current = 1
  fetchData()
}

// Pagination handlers
function onPageChange(page: number) {
  pagination.current = page
  fetchData()
}

function onPageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.current = 1
  fetchData()
}

// Drawer
function openDrawer(record: UsageLog) {
  currentLog.value = record
  drawerVisible.value = true
}

// Formatters
function latencyClass(ms: number): string {
  if (ms > 5000) return 'latency-slow'
  if (ms > 2000) return 'latency-medium'
  return ''
}

// Init
onMounted(() => {
  fetchData()
  loadFilterOptions()
})
</script>

<style scoped lang="less">
.request-logs-page {
  // --- Page Title ---
  .page-title {
    font-size: 16px;
    font-weight: 600;
  }

  // --- Filter Area ---
  .filter-area {
    margin-bottom: 16px;
  }

  .filter-item {
    .filter-label {
      display: block;
      font-size: 12px;
      color: var(--color-text-3);
      margin-bottom: 4px;
      line-height: 1;
    }
  }

  .filter-actions {
    display: flex;
    flex-direction: column;
  }

  .advanced-row {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--color-fill-3);
  }

  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .slide-down-enter-from,
  .slide-down-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
    padding-top: 0;
  }

  .slide-down-enter-to,
  .slide-down-leave-from {
    opacity: 1;
    max-height: 100px;
  }

  // --- Table ---
  :deep(.arco-table) {
    font-size: 13px;
  }

  :deep(.arco-table-tr) {
    transition: background-color 0.15s;
  }

  :deep(.clickable-row) {
    cursor: pointer;
  }

  :deep(.clickable-row:hover) {
    background-color: var(--color-fill-1) !important;
  }

  .cell-time {
    color: var(--color-text-2);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .cell-model {
    font-weight: 600;
    color: var(--color-text-1);
  }

  .cell-model-used {
    color: var(--color-text-3);

    &.model-mismatch {
      color: rgb(var(--warning-6));
      font-weight: 500;
    }
  }

  .cell-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 22px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;

    &.status-success {
      background: var(--color-success-light-1);
      color: rgb(var(--green-6));
    }

    &.status-warn {
      background: var(--color-warning-light-1);
      color: rgb(var(--orange-6));
    }

    &.status-error {
      background: var(--color-danger-light-1);
      color: rgb(var(--red-6));
    }

    &.status-rate-limit {
      background: rgba(var(--purple-1), 0.4);
      color: rgb(var(--purple-6));
    }

    &.status-default {
      background: var(--color-fill-2);
      color: var(--color-text-2);
    }
  }

  .cell-num {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-2);
  }

  .cell-latency {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-2);

    &.latency-medium {
      color: rgb(var(--orange-6));
    }

    &.latency-slow {
      color: rgb(var(--red-6));
      font-weight: 600;
    }
  }

  .cell-cost {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-1);
    font-weight: 500;
  }

  .cell-dash {
    color: var(--color-text-4);
  }

  .empty-state {
    padding: 48px 0;
    color: var(--color-text-4);
    text-align: center;

    .empty-icon {
      font-size: 36px;
      margin-bottom: 8px;
      opacity: 0.4;
    }

    p {
      margin: 0;
      font-size: 13px;
    }
  }
}
</style>

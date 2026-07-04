<template>
  <div class="alert-logs-page">
    <!-- Stats Overview -->
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic
            :title="t('safety.alerts.todayCount')"
            :value="todayCount"
            :loading="statsLoading"
            :value-style="{ color: 'rgb(var(--arcoblue-6))' }"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic
            :title="t('safety.alerts.weekCount')"
            :value="weekCount"
            :loading="statsLoading"
            :value-style="{ color: 'rgb(var(--orange-6))' }"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic
            :title="t('safety.alerts.criticalCount')"
            :value="criticalCount"
            :loading="statsLoading"
            :value-style="{ color: 'rgb(var(--red-6))' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- Main Card -->
    <a-card class="general-card">
      <template #title>
        <span class="page-title">{{ t('safety.alerts.title') }}</span>
      </template>

      <!-- Filters -->
      <div class="filter-area">
        <a-row :gutter="12" align="center">
          <a-col :span="4">
            <div class="filter-item">
              <label class="filter-label">{{ t('safety.alerts.filterEngine') }}</label>
              <a-select
                v-model="filter.engine_type"
                :placeholder="t('common.all')"
                allow-clear
                style="width: 100%"
              >
                <a-option
                  v-for="key in engineTypeOptions"
                  :key="key"
                  :value="key"
                  :label="t(`safety.engineType.${key}`)"
                />
              </a-select>
            </div>
          </a-col>
          <a-col :span="3">
            <div class="filter-item">
              <label class="filter-label">{{ t('safety.alerts.filterSeverity') }}</label>
              <a-select
                v-model="filter.severity"
                :placeholder="t('common.all')"
                allow-clear
                style="width: 100%"
              >
                <a-option value="low" :label="t('safety.severity.low')" />
                <a-option value="medium" :label="t('safety.severity.medium')" />
                <a-option value="high" :label="t('safety.severity.high')" />
                <a-option value="warning" :label="t('safety.severity.warning')" />
                <a-option value="critical" :label="t('safety.severity.critical')" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="3">
            <div class="filter-item">
              <label class="filter-label">{{ t('safety.alerts.filterAction') }}</label>
              <a-select
                v-model="filter.action"
                :placeholder="t('common.all')"
                allow-clear
                style="width: 100%"
              >
                <a-option value="block" :label="t('safety.action.block')" />
                <a-option value="log" :label="t('safety.action.log')" />
                <a-option value="mask" :label="t('safety.action.mask')" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="3">
            <div class="filter-item">
              <label class="filter-label">{{ t('safety.alerts.filterStatus') }}</label>
              <a-select
                v-model="filter.status"
                :placeholder="t('common.all')"
                allow-clear
                style="width: 100%"
              >
                <a-option value="logged" :label="t('safety.alertStatus.logged')" />
                <a-option value="sent" :label="t('safety.alertStatus.sent')" />
                <a-option value="partial" :label="t('safety.alertStatus.partial')" />
                <a-option value="failed" :label="t('safety.alertStatus.failed')" />
                <a-option value="dropped" :label="t('safety.alertStatus.dropped')" />
                <a-option value="blocked" :label="t('safety.alertStatus.blocked')" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="filter-item">
              <label class="filter-label">{{ t('safety.alerts.filterTimeRange') }}</label>
              <a-range-picker
                v-model="filter.timeRange"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                show-time
              />
            </div>
          </a-col>
          <a-col :span="5">
            <div class="filter-item filter-actions">
              <label class="filter-label">&nbsp;</label>
              <a-space>
                <a-checkbox v-model="filter.showContent">
                  {{ t('safety.alerts.showContent') }}
                </a-checkbox>
                <a-button type="primary" @click="applyFilter">{{ t('common.search') }}</a-button>
                <a-button @click="resetFilter">{{ t('common.reset') }}</a-button>
              </a-space>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- Table -->
      <a-table
        :data="logs"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1100 }"
        row-key="id"
        size="small"
        :bordered="false"
        row-class="clickable-row"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
        @row-click="(record: any) => openDetail(record as GuardrailAlertLog)"
      >
        <template #columns>
          <a-table-column :title="t('safety.alerts.colTime')" data-index="created_at" :width="170">
            <template #cell="{ record }">
              <span class="cell-time">{{ formatTime(record.created_at) }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('safety.alerts.colRule')" data-index="rule_name" :width="160">
            <template #cell="{ record }">
              <span class="cell-rule">{{ record.rule_name }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.alerts.colEngine')"
            data-index="engine_type"
            :width="140"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ t(`safety.engineType.${record.engine_type}`) }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.alerts.colSeverity')"
            data-index="severity"
            :width="100"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag :color="severityColor(record.severity)">
                {{ t(`safety.severity.${record.severity}`) }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.alerts.colAction')"
            data-index="action"
            :width="90"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag :color="actionColor(record.action)">
                {{ t(`safety.action.${record.action}`) }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.alerts.colDirection')"
            data-index="direction"
            :width="80"
            align="center"
          >
            <template #cell="{ record }">
              {{ t(`safety.direction.${record.direction}`) }}
            </template>
          </a-table-column>

          <a-table-column :title="t('safety.alerts.colModel')" data-index="model" :width="140">
            <template #cell="{ record }">
              <span class="cell-model">{{ record.model || '-' }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.alerts.colStatus')"
            data-index="status"
            :width="100"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag :color="statusColor(record.status)">
                {{ t(`safety.alertStatus.${record.status}`) }}
              </a-tag>
            </template>
          </a-table-column>

          <!-- Content preview (only shown when showContent is checked) -->
          <a-table-column
            v-if="filter.showContent"
            :title="t('safety.alerts.contentPreview')"
            data-index="content_preview"
            :width="240"
            :ellipsis="true"
            :tooltip="true"
          >
            <template #cell="{ record }">
              <span class="cell-preview">{{ record.content_preview || '-' }}</span>
            </template>
          </a-table-column>
        </template>

        <template #empty>
          <div class="empty-state">
            <icon-file class="empty-icon" />
            <p>{{ t('safety.rules.noResult') }}</p>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- Detail Drawer -->
    <alert-detail v-model:visible="drawerVisible" :log="detailLog" :loading="detailLoading" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { Message } from '@arco-design/web-vue'
import { alertLogApi } from '@/api/safety'
import { logger } from '@/logger'
import { useLoading } from '@/hooks/loading'
import { formatTime } from '@/utils/format'
import AlertDetail from './components/alert-detail.vue'
import type { GuardrailAlertLog, GuardrailEngineType, AlertLogQuery } from '@/types'

const { t } = useI18n()

// Engine type options
const engineTypeOptions: GuardrailEngineType[] = [
  'keyword_filter',
  'pii_detection',
  'prompt_injection',
  'credential_detection',
  'openai_moderation',
  'content_length',
  'agent_fingerprint',
  'behavior_analysis',
  'webhook',
  'ip_binding',
]

// ---------- Stats ----------
const { loading: statsLoading, setLoading: setStatsLoading } = useLoading()
const todayCount = ref(0)
const weekCount = ref(0)
const criticalCount = ref(0)

async function fetchStats() {
  setStatsLoading(true)
  try {
    const todayStart = dayjs().startOf('day').format()
    const weekStart = dayjs().startOf('week').format()

    // Today alerts
    const todayRes = await alertLogApi.stats({ granularity: 'hour', start_time: todayStart })
    todayCount.value = todayRes.data?.by_time?.reduce((sum, b) => sum + b.count, 0) ?? 0

    // Week alerts
    const weekRes = await alertLogApi.stats({ granularity: 'day', start_time: weekStart })
    weekCount.value = weekRes.data?.by_time?.reduce((sum, b) => sum + b.count, 0) ?? 0

    // Critical alerts
    const criticalRes = await alertLogApi.stats({ severity: 'critical' })
    criticalCount.value = criticalRes.data?.by_rule?.reduce((sum, b) => sum + b.count, 0) ?? 0
  } catch (e) {
    // Non-critical: stats are best-effort, but surface the failure in the debug log.
    logger.warn('Failed to load alert stats', e, 'app')
  } finally {
    setStatsLoading(false)
  }
}

// ---------- Filters & Pagination ----------
const { loading, setLoading } = useLoading()
const logs = ref<GuardrailAlertLog[]>([])
const filter = reactive({
  engine_type: '',
  severity: '',
  action: '',
  status: '',
  timeRange: [] as string[],
  showContent: false,
})
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

function buildQuery(): AlertLogQuery {
  const query: AlertLogQuery = {
    page: pagination.current,
    page_size: pagination.pageSize,
  }
  if (filter.engine_type) query.engine_type = filter.engine_type
  if (filter.severity) query.severity = filter.severity
  if (filter.action) query.action = filter.action
  if (filter.status) query.status = filter.status
  if (filter.timeRange?.length === 2) {
    query.start_time = filter.timeRange[0]
    query.end_time = filter.timeRange[1]
  }
  if (filter.showContent) query.include_content = 'true'
  return query
}

async function fetchData() {
  setLoading(true)
  try {
    const res = await alertLogApi.list(buildQuery())
    logs.value = res.data ?? []
    // Backend returns a flat { total, page, page_size } envelope (see AlertLogListResponse)
    pagination.total = res.total ?? res.pagination?.total ?? 0
  } catch {
    Message.error(t('common.operationFail'))
  } finally {
    setLoading(false)
  }
}

function onPageChange(page: number) {
  pagination.current = page
  fetchData()
}

function onPageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.current = 1
  fetchData()
}

function applyFilter() {
  pagination.current = 1
  fetchData()
}

function resetFilter() {
  filter.engine_type = ''
  filter.severity = ''
  filter.action = ''
  filter.status = ''
  filter.timeRange = []
  filter.showContent = false
  applyFilter()
}

// ---------- Detail Drawer ----------
const drawerVisible = ref(false)
const { loading: detailLoading, setLoading: setDetailLoading } = useLoading()
const detailLog = ref<GuardrailAlertLog | null>(null)

async function openDetail(record: GuardrailAlertLog) {
  drawerVisible.value = true
  setDetailLoading(true)
  try {
    const res = await alertLogApi.detail(record.id)
    detailLog.value = res.data
  } catch {
    detailLog.value = record
  } finally {
    setDetailLoading(false)
  }
}

// ---------- Tag Colors ----------
function severityColor(severity: string): string {
  const map: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    warning: 'orangered',
    critical: 'purple',
  }
  return map[severity] || 'blue'
}

function actionColor(action: string): string {
  const map: Record<string, string> = {
    block: 'red',
    log: 'blue',
    mask: 'orange',
  }
  return map[action] || 'blue'
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    logged: 'blue',
    sent: 'green',
    partial: 'orange',
    failed: 'red',
    dropped: 'gray',
    blocked: 'red',
  }
  return map[status] || 'blue'
}

// ---------- Init ----------
onMounted(() => {
  fetchData()
  fetchStats()
})
</script>

<style scoped lang="less">
.alert-logs-page {
  .page-title {
    font-size: 16px;
    font-weight: 600;
  }

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

  .cell-rule {
    font-weight: 600;
    color: var(--color-text-1);
  }

  .cell-model {
    color: var(--color-text-2);
  }

  .cell-preview {
    color: var(--color-text-2);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

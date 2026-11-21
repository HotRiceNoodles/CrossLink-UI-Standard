<template>
  <div class="request-debug-page">
    <a-card class="general-card">
      <template #title>
        <div class="header-title">
          <span class="page-title">{{ t('requestDebug.title') }}</span>
          <span class="page-subtitle">{{ t('requestDebug.subtitle') }}</span>
        </div>
      </template>
      <template #extra>
        <a-space>
          <!-- 调试配置（GET/PUT /debug/config）：开关/采样率/仅失败热更新，Pro+ -->
          <template v-if="canViewConfig">
            <span class="debug-mode-label">{{ t('requestDebug.debugMode') }}</span>
            <a-switch
              :model-value="debugConfig?.enabled"
              :loading="debugModeLoading"
              :disabled="!canEditConfig"
              @change="(v: string | number | boolean) => onConfigChange('enabled', v)"
            />
            <a-tooltip :content="t('requestDebug.samplingRateTip')">
              <span class="debug-mode-label">{{ t('requestDebug.samplingRate') }}</span>
            </a-tooltip>
            <a-input-number
              :model-value="debugConfig?.sampling_rate"
              :min="0"
              :max="100"
              :step="10"
              size="small"
              :disabled="!canEditConfig"
              style="width: 90px"
              @change="(v: number | undefined) => onConfigChange('sampling_rate', v)"
            />
            <a-tooltip :content="t('requestDebug.onlyFailedTip')">
              <span class="debug-mode-label">{{ t('requestDebug.onlyFailed') }}</span>
            </a-tooltip>
            <a-switch
              :model-value="debugConfig?.only_failed"
              :loading="debugModeLoading"
              :disabled="!canEditConfig"
              @change="(v: string | number | boolean) => onConfigChange('only_failed', v)"
            />
            <!-- 只读容量信息：环形缓冲条数与单条报文上限（进程级，改配置需重启） -->
            <a-tooltip
              v-if="debugConfig"
              :content="
                t('requestDebug.capacityInfo', {
                  capacity: debugConfig.capacity,
                  size: debugConfig.max_body_size,
                })
              "
            >
              <a-tag color="gray" size="small">
                <template #icon><icon-info-circle /></template>
                {{ debugConfig.capacity }} · {{ debugConfig.max_body_size }}B
              </a-tag>
            </a-tooltip>
          </template>
          <template v-else>
            <a-tooltip :content="t('requestDebug.debugModeHint')">
              <a-tag color="gray" size="small">{{ t('requestDebug.debugModeHint') }}</a-tag>
            </a-tooltip>
          </template>

          <a-divider direction="vertical" />

          <span class="debug-mode-label">{{ t('requestDebug.autoRefresh') }}</span>
          <a-switch v-model="autoRefresh" />

          <a-button @click="fetchList">
            <template #icon><icon-refresh /></template>
            {{ t('common.refresh') }}
          </a-button>

          <a-popconfirm
            v-if="canClear"
            :content="t('requestDebug.clearConfirm')"
            :ok-text="t('requestDebug.clear')"
            type="warning"
            position="br"
            @ok="onClear"
          >
            <a-button status="danger">
              <template #icon><icon-delete /></template>
              {{ t('requestDebug.clear') }}
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>

      <!-- Filters (all client-side) -->
      <div class="filter-area">
        <a-row :gutter="12" align="center">
          <a-col :span="5">
            <div class="filter-item">
              <label class="filter-label">{{ t('requestDebug.status') }}</label>
              <a-select v-model="filter.status" style="width: 100%">
                <a-option value="all" :label="t('requestDebug.statusAll')" />
                <a-option value="success" :label="t('requestDebug.statusSuccess')" />
                <a-option value="fail" :label="t('requestDebug.statusFail')" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="filter-item">
              <label class="filter-label">{{ t('requestDebug.colModel') }}</label>
              <a-select
                v-model="filter.model"
                :placeholder="t('common.all')"
                allow-clear
                allow-search
                style="width: 100%"
              >
                <a-option v-for="m in modelOptions" :key="m" :value="m" :label="m" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="filter-item">
              <label class="filter-label">{{ t('requestDebug.path') }}</label>
              <a-select
                v-model="filter.path"
                :placeholder="t('common.all')"
                allow-clear
                allow-search
                style="width: 100%"
              >
                <a-option v-for="p in pathOptions" :key="p" :value="p" :label="p" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="7">
            <div class="filter-item">
              <label class="filter-label">{{ t('requestDebug.keyword') }}</label>
              <a-input-search
                v-model="filter.keyword"
                :placeholder="t('requestDebug.keyword')"
                allow-clear
                style="width: 100%"
              />
            </div>
          </a-col>
        </a-row>
      </div>

      <a-table
        :data="filteredEntries"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1000 }"
        row-key="id"
        size="small"
        :bordered="false"
        row-class="clickable-row"
        @row-click="openDetail"
      >
        <template #columns>
          <a-table-column :title="t('requestDebug.colTime')" data-index="timestamp" :width="170">
            <template #cell="{ record }">
              <span class="cell-time">{{ formatTime(record.timestamp) }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('requestDebug.colModel')" data-index="model" :width="180">
            <template #cell="{ record }">
              <span class="cell-model">{{ record.model || '-' }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('requestDebug.colPath')" data-index="path" :width="200">
            <template #cell="{ record }">
              <span class="cell-path">
                <a-tag size="small">{{ record.method }}</a-tag>
                {{ record.path }}
              </span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('requestDebug.colStatus')"
            data-index="status"
            :width="90"
            align="center"
          >
            <template #cell="{ record }">
              <div class="status-cell">
                <span class="cell-status" :class="statusClass(record.status)">
                  {{ record.status }}
                </span>
                <!-- 链路诊断：200 不代表链路无恙（可能经重试/容灾才成功） -->
                <a-tooltip
                  v-if="record.retry_count || record.fallback_count"
                  :content="record.last_upstream_error || t('requestDebug.chainAbnormal')"
                >
                  <span class="chain-badge">
                    <a-tag v-if="record.retry_count" color="orangered" size="small">
                      {{ t('requestDebug.retryTag', { n: record.retry_count }) }}
                    </a-tag>
                    <a-tag v-if="record.fallback_count" color="orange" size="small">
                      {{ t('requestDebug.fallbackTag', { n: record.fallback_count }) }}
                    </a-tag>
                  </span>
                </a-tooltip>
              </div>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('requestDebug.colDuration')"
            data-index="duration_ms"
            :width="100"
            align="right"
          >
            <template #cell="{ record }">
              <span class="cell-num" :class="latencyClass(record.duration_ms)">
                {{ formatLatency(record.duration_ms) }}
              </span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('requestDebug.colStream')"
            data-index="stream"
            :width="90"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag size="small" :color="record.stream ? 'arcoblue' : 'gray'">
                {{ record.stream ? t('requestDebug.stream') : t('requestDebug.nonStream') }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('requestDebug.colUpstream')"
            data-index="upstream_count"
            :width="110"
            align="center"
          >
            <template #cell="{ record }">
              <span class="cell-num">{{ record.upstream_count }}</span>
            </template>
          </a-table-column>
        </template>

        <template #empty>
          <div class="empty-state">
            <icon-bug class="empty-icon" />
            <p>{{ t('requestDebug.empty') }}</p>
            <p class="empty-hint">{{ t('requestDebug.emptyHint') }}</p>
          </div>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { debugApi } from '@/api/debug'
import { useLoading } from '@/hooks/loading'
import { useUserStore } from '@/store'
import { formatTime, formatLatency, statusClass } from '@/utils/format'
import type { DebugEntrySummary, DebugConfig } from '@/types'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const { loading, setLoading } = useLoading()

const entries = ref<DebugEntrySummary[]>([])

// --- 调试配置（专用 /debug/config 端点：三字段热更新 + 持久化；GET 需 debug:list，
// PUT 需 debug:clear。旧实现走 Pro 聚合端点 /system/settings 且只覆盖 debug_mode）---
const debugConfig = ref<DebugConfig | null>(null)
const { loading: debugModeLoading, setLoading: setDebugModeLoading } = useLoading()
const canViewConfig = computed(
  () => userStore.isProOrAbove && userStore.hasPermission('debug:list'),
)
const canEditConfig = computed(() => userStore.hasPermission('debug:clear'))
const canClear = computed(() => userStore.hasPermission('debug:clear'))

async function loadDebugConfig() {
  if (!canViewConfig.value) return
  try {
    const res = await debugApi.getConfig()
    debugConfig.value = res.data
  } catch {
    // 配置端点不可用时静默降级：仅隐藏控制，列表不受影响
  }
}

async function onConfigChange(field: 'enabled' | 'sampling_rate' | 'only_failed', value: unknown) {
  if (!debugConfig.value) return
  const next = { ...debugConfig.value }
  if (field === 'sampling_rate') {
    if (typeof value !== 'number' || value < 0 || value > 100) return
    next.sampling_rate = value
  } else {
    next[field] = Boolean(value)
  }
  setDebugModeLoading(true)
  try {
    // PUT 三字段全必填——按本地副本整体提交
    const res = await debugApi.updateConfig({
      enabled: next.enabled,
      sampling_rate: next.sampling_rate,
      only_failed: next.only_failed,
    })
    debugConfig.value = res.data
    Message.success(t('common.updateSuccess'))
  } catch {
    Message.error(t('common.operationFail'))
    await loadDebugConfig()
  } finally {
    setDebugModeLoading(false)
  }
}

// --- list data ---
async function fetchList() {
  setLoading(true)
  try {
    const res = await debugApi.list()
    entries.value = res.data ?? []
  } catch {
    Message.error(t('requestDebug.fetchFail'))
  } finally {
    setLoading(false)
  }
}

async function onClear() {
  try {
    await debugApi.clear()
    Message.success(t('requestDebug.clearSuccess'))
    fetchList()
  } catch {
    Message.error(t('requestDebug.clearFail'))
  }
}

function openDetail(record: DebugEntrySummary) {
  router.push({
    name: 'requestDebugDetail',
    params: { seq: record.seq },
    query: record.model ? { model: record.model } : undefined,
  })
}

// --- filters (client-side) ---
const filter = reactive({
  status: 'all' as 'all' | 'success' | 'fail',
  model: undefined as string | undefined,
  path: undefined as string | undefined,
  keyword: '',
})

const modelOptions = computed(() =>
  Array.from(new Set(entries.value.map((e) => e.model).filter(Boolean))).sort(),
)
const pathOptions = computed(() =>
  Array.from(new Set(entries.value.map((e) => e.path).filter(Boolean))).sort(),
)

const filteredEntries = computed(() => {
  const kw = filter.keyword.trim().toLowerCase()
  return entries.value.filter((e) => {
    if (filter.status === 'success' && !(e.status >= 200 && e.status < 400)) return false
    if (filter.status === 'fail' && e.status >= 200 && e.status < 400) return false
    if (filter.model && e.model !== filter.model) return false
    if (filter.path && e.path !== filter.path) return false
    if (kw) {
      const hay = `${e.model} ${e.path} ${e.id}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
})

// --- auto refresh ---
const autoRefresh = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  stopTimer()
  timer = setInterval(fetchList, 5000)
}
function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
watch(autoRefresh, (on) => (on ? startTimer() : stopTimer()))

// --- formatters ---
function latencyClass(ms: number): string {
  if (ms > 5000) return 'latency-slow'
  if (ms > 2000) return 'latency-medium'
  return ''
}

onMounted(() => {
  loadDebugConfig()
  fetchList()
})

onUnmounted(() => stopTimer())
</script>

<style scoped lang="less">
.request-debug-page {
  .header-title {
    display: flex;
    flex-direction: column;

    .page-title {
      font-size: 16px;
      font-weight: 600;
    }

    .page-subtitle {
      font-size: 12px;
      color: var(--color-text-3);
      font-weight: 400;
      margin-top: 2px;
    }
  }

  .status-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .debug-mode-label {
    font-size: 13px;
    color: var(--color-text-2);
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

  .cell-path {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-2);
    font-size: 12px;
  }

  .cell-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 22px;
    border-radius: var(--cl-radius-sm);
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;

    &.success {
      background: var(--color-success-light-1);
      color: rgb(var(--green-6));
    }

    &.warn {
      background: var(--color-warning-light-1);
      color: rgb(var(--orange-6));
    }

    &.error {
      background: var(--color-danger-light-1);
      color: rgb(var(--red-6));
    }

    &.default {
      background: var(--color-fill-2);
      color: var(--color-text-2);
    }
  }

  .cell-num {
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

    .empty-hint {
      font-size: 12px;
      margin-top: 4px;
    }
  }
}
</style>

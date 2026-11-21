<template>
  <div class="behavior-page">
    <!-- 部署状态横幅：为什么(没)在学习 -->
    <a-card class="general-card" style="margin-bottom: 16px">
      <a-spin :loading="statusLoading" style="width: 100%">
        <template v-if="status">
          <div class="status-bar">
            <a-tag :color="status.enabled ? 'green' : 'gray'">
              {{ status.enabled ? t('behavior.learningOn') : t('behavior.learningOff') }}
            </a-tag>
            <a-tag v-if="status.learning_stale" color="red">
              {{ t('behavior.learningStale') }}
            </a-tag>
            <span v-if="status.last_baseline_computed_at" class="status-item">
              {{ t('behavior.lastComputed') }}: {{ formatTime(status.last_baseline_computed_at) }}
            </span>
            <span class="status-item">
              {{ t('behavior.openAnomalies') }}: {{ status.counts.anomalies_open }}
            </span>
            <span class="status-item">
              {{ t('behavior.fpCandidates') }}: {{ status.counts.fingerprints_candidate }}
            </span>
            <a-button size="small" type="text" @click="fetchStatus">
              <template #icon><icon-refresh /></template>
            </a-button>
          </div>
        </template>
      </a-spin>
    </a-card>

    <a-card class="general-card">
      <template #title>{{ t('behavior.title') }}</template>

      <a-tabs v-model:active-key="activeTab" type="rounded" @change="onTabChange">
        <!-- 异常台账 -->
        <a-tab-pane key="anomalies" :title="t('behavior.tabAnomalies')">
          <a-row :gutter="16" style="margin-bottom: 12px">
            <a-col :span="6">
              <a-select
                v-model="anomalyFilter.status"
                :placeholder="t('behavior.filterStatus')"
                allow-clear
                @change="fetchAnomalies"
              >
                <a-option value="open" :label="t('behavior.statusOpen')" />
                <a-option value="confirmed" :label="t('behavior.statusConfirmed')" />
                <a-option value="dismissed" :label="t('behavior.statusDismissed')" />
                <a-option value="expired" :label="t('behavior.statusExpired')" />
              </a-select>
            </a-col>
            <a-col :span="6">
              <a-select
                v-model="anomalyFilter.band"
                :placeholder="t('behavior.filterBand')"
                allow-clear
                @change="fetchAnomalies"
              >
                <a-option value="suspicious" :label="t('behavior.bandSuspicious')" />
                <a-option value="anomalous" :label="t('behavior.bandAnomalous')" />
                <a-option value="critical" :label="t('behavior.bandCritical')" />
              </a-select>
            </a-col>
            <a-col :span="6">
              <a-select
                v-model="anomalyFilter.entity_type"
                :placeholder="t('behavior.filterEntity')"
                allow-clear
                @change="fetchAnomalies"
              >
                <a-option value="key" :label="t('behavior.entityKey')" />
                <a-option value="org" :label="t('behavior.entityOrg')" />
              </a-select>
            </a-col>
            <a-col :span="6" style="text-align: right">
              <a-button @click="fetchAnomalies">
                <template #icon><icon-refresh /></template>
                {{ t('common.refresh') }}
              </a-button>
            </a-col>
          </a-row>

          <a-alert v-if="anomalyError" type="error">{{ t('behavior.loadFail') }}</a-alert>

          <a-table
            :data="anomalies"
            :loading="anomalyLoading"
            :pagination="anomalyPagination"
            row-key="id"
            size="small"
            @page-change="onAnomalyPageChange"
          >
            <template #columns>
              <a-table-column :title="t('behavior.colEntity')" :width="110">
                <template #cell="{ record }">
                  <span class="mono">{{ record.entity_type }}#{{ record.entity_id }}</span>
                </template>
              </a-table-column>
              <a-table-column :title="t('behavior.colBand')" :width="100" align="center">
                <template #cell="{ record }">
                  <a-tag :color="bandColor(record.band)" size="small">
                    {{ t(`behavior.band_${record.band}`) }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column :title="t('behavior.colScore')" :width="120" align="right">
                <template #cell="{ record }">
                  {{ record.score.toFixed(2) }}
                  <span class="muted">/ {{ record.score_peak.toFixed(2) }}</span>
                </template>
              </a-table-column>
              <a-table-column
                :title="t('behavior.colHits')"
                data-index="hit_count"
                :width="80"
                align="right"
              />
              <a-table-column :title="t('behavior.colFirstSeen')" :width="160">
                <template #cell="{ record }">{{ formatTime(record.first_seen_at) }}</template>
              </a-table-column>
              <a-table-column :title="t('behavior.colLastHit')" :width="160">
                <template #cell="{ record }">{{ formatTime(record.last_hit_at) }}</template>
              </a-table-column>
              <a-table-column :title="t('common.status')" :width="100" align="center">
                <template #cell="{ record }">
                  <a-tag :color="statusColor(record.status)" size="small">
                    {{ t(`behavior.status_${record.status}`) }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column
                v-if="canManage"
                :title="t('common.actions')"
                :width="140"
                fixed="right"
              >
                <template #cell="{ record }">
                  <!-- 终态不可改判（D16）：仅 open 可裁决 -->
                  <a-space v-if="record.status === 'open'" :size="4">
                    <a-popconfirm
                      :content="t('behavior.confirmTip')"
                      type="warning"
                      @ok="decideAnomaly(record, 'confirm')"
                    >
                      <a-button type="text" size="small" status="danger">
                        {{ t('behavior.confirm') }}
                      </a-button>
                    </a-popconfirm>
                    <a-popconfirm
                      :content="t('behavior.dismissTip')"
                      type="warning"
                      @ok="decideAnomaly(record, 'dismiss')"
                    >
                      <a-button type="text" size="small">
                        {{ t('behavior.dismiss') }}
                      </a-button>
                    </a-popconfirm>
                  </a-space>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column :title="t('behavior.colDimensions')" :width="70" align="center">
                <template #cell="{ record }">
                  <a-tooltip v-if="record.dimensions" :content="t('behavior.dimensionsTip')">
                    <a-button type="text" size="small" @click="showDimensions(record)">
                      <template #icon><icon-code /></template>
                    </a-button>
                  </a-tooltip>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
            </template>
            <template #expand-cell="{ record }">
              <pre v-if="record.dimensions" class="dims-block">{{
                prettyDimensions(record.dimensions)
              }}</pre>
              <span v-else class="muted">{{ t('behavior.noDimensions') }}</span>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 指纹库 -->
        <a-tab-pane key="fingerprints" :title="t('behavior.tabFingerprints')">
          <a-row :gutter="16" style="margin-bottom: 12px">
            <a-col :span="8">
              <a-select
                v-model="fpFilter.status"
                :placeholder="t('behavior.filterStatus')"
                allow-clear
                @change="fetchFingerprints"
              >
                <a-option value="candidate" :label="t('behavior.fpCandidate')" />
                <a-option value="approved" :label="t('behavior.fpApproved')" />
                <a-option value="retired" :label="t('behavior.fpRetired')" />
              </a-select>
            </a-col>
            <a-col :span="16" style="text-align: right">
              <a-button @click="fetchFingerprints">
                <template #icon><icon-refresh /></template>
                {{ t('common.refresh') }}
              </a-button>
            </a-col>
          </a-row>

          <a-alert v-if="fpError" type="error">{{ t('behavior.loadFail') }}</a-alert>

          <a-table
            :data="fingerprints"
            :loading="fpLoading"
            :pagination="fpPagination"
            row-key="id"
            size="small"
            @page-change="onFpPageChange"
          >
            <template #columns>
              <a-table-column :title="t('behavior.colEntity')" :width="110">
                <template #cell="{ record }">
                  <span class="mono">{{ record.entity_type }}#{{ record.entity_id }}</span>
                </template>
              </a-table-column>
              <a-table-column :title="t('behavior.colDimensionSet')" :width="240">
                <template #cell="{ record }">
                  <span class="mono">{{ record.dimension_set }}</span>
                </template>
              </a-table-column>
              <a-table-column
                :title="t('behavior.colHits')"
                data-index="hit_count"
                :width="80"
                align="right"
              />
              <a-table-column :title="t('common.status')" :width="110" align="center">
                <template #cell="{ record }">
                  <a-tag
                    :color="
                      record.status === 'candidate'
                        ? 'orange'
                        : record.status === 'approved'
                          ? 'green'
                          : 'gray'
                    "
                    size="small"
                  >
                    {{ t(`behavior.fp_${record.status}`) }}
                  </a-tag>
                </template>
              </a-table-column>
              <a-table-column
                :title="t('behavior.colDecidedBy')"
                data-index="decided_by"
                :width="110"
              >
                <template #cell="{ record }">{{ record.decided_by || '-' }}</template>
              </a-table-column>
              <a-table-column :title="t('behavior.colUpdatedAt')" :width="160">
                <template #cell="{ record }">{{ formatTime(record.updated_at) }}</template>
              </a-table-column>
              <a-table-column
                v-if="canManage"
                :title="t('common.actions')"
                :width="150"
                fixed="right"
              >
                <template #cell="{ record }">
                  <!-- 候选才可裁决；approve 只登记为已知模式，不自动生效（observe-only） -->
                  <a-space v-if="record.status === 'candidate'" :size="4">
                    <a-popconfirm
                      :content="t('behavior.approveTip')"
                      type="warning"
                      @ok="decideFingerprint(record, 'approve')"
                    >
                      <a-button type="text" size="small">{{ t('behavior.approve') }}</a-button>
                    </a-popconfirm>
                    <a-popconfirm
                      :content="t('behavior.retireTip')"
                      type="warning"
                      @ok="decideFingerprint(record, 'retire')"
                    >
                      <a-button type="text" size="small" status="danger">
                        {{ t('behavior.retire') }}
                      </a-button>
                    </a-popconfirm>
                  </a-space>
                  <span v-else class="muted">-</span>
                </template>
              </a-table-column>
              <a-table-column :title="t('behavior.colTemplate')" :width="70" align="center">
                <template #cell="{ record }">
                  <a-tooltip :content="t('behavior.dimensionsTip')">
                    <a-button type="text" size="small" @click="showDimensions(record)">
                      <template #icon><icon-code /></template>
                    </a-button>
                  </a-tooltip>
                </template>
              </a-table-column>
            </template>
            <template #expand-cell="{ record }">
              <pre class="dims-block">{{ prettyDimensions(record.template) }}</pre>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 覆盖率 -->
        <a-tab-pane key="coverage" :title="t('behavior.tabCoverage')">
          <a-alert type="info" style="margin-bottom: 12px">{{ t('behavior.coverageTip') }}</a-alert>
          <a-table
            :data="coverage"
            :loading="coverageLoading"
            :pagination="false"
            row-key="entity_type"
            size="small"
          >
            <template #columns>
              <a-table-column :title="t('behavior.colEntity')" :width="140">
                <template #cell="{ record }">
                  <span class="mono">{{ record.entity_type }}#{{ record.entity_id }}</span>
                </template>
              </a-table-column>
              <a-table-column
                :title="t('behavior.colRollupMetrics')"
                data-index="rollup_metrics"
                :width="140"
                align="right"
              />
              <a-table-column
                :title="t('behavior.colBaselineMetrics')"
                data-index="baseline_metrics"
                :width="140"
                align="right"
              />
              <a-table-column :title="t('behavior.colProtected')" :width="120" align="center">
                <template #cell="{ record }">
                  <a-tag :color="record.protected ? 'green' : 'red'" size="small">
                    {{ record.protected ? t('common.yes') : t('common.no') }}
                  </a-tag>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 维度/模板 JSON 详情 -->
    <a-modal
      v-model:visible="dimsVisible"
      :title="t('behavior.colDimensions')"
      :width="640"
      :footer="false"
    >
      <pre class="dims-block modal">{{ dimsText }}</pre>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { behaviorApi } from '@/api/behavior'
import { useUserStore } from '@/store'
import { formatTime } from '@/utils/format'
import type {
  BehaviorAnomaly,
  BehaviorAnomalyStatus,
  BehaviorBand,
  BehaviorCoverageRow,
  BehaviorFingerprint,
  BehaviorStatus,
} from '@/types'

const { t } = useI18n()
const userStore = useUserStore()
const canManage = computed(() => userStore.hasPermission('behavior:manage'))

// ---- status banner ----
const status = ref<BehaviorStatus | null>(null)
const statusLoading = ref(false)

async function fetchStatus() {
  statusLoading.value = true
  try {
    const res = await behaviorApi.status()
    status.value = res.data
  } catch {
    status.value = null
  } finally {
    statusLoading.value = false
  }
}

// ---- anomalies tab ----
const activeTab = ref('anomalies')
const anomalyFilter = reactive<{
  status?: BehaviorAnomalyStatus
  band?: BehaviorBand
  entity_type?: 'key' | 'org'
}>({})
const anomalies = ref<BehaviorAnomaly[]>([])
const anomalyLoading = ref(false)
const anomalyError = ref(false)
const anomalyPagination = reactive({ current: 1, pageSize: 20, total: 0, showTotal: true })

async function fetchAnomalies() {
  anomalyLoading.value = true
  anomalyError.value = false
  try {
    const res = await behaviorApi.anomalies({
      ...anomalyFilter,
      page: anomalyPagination.current,
      page_size: anomalyPagination.pageSize,
    })
    anomalies.value = res.data ?? []
    anomalyPagination.total = res.total
  } catch {
    anomalyError.value = true
  } finally {
    anomalyLoading.value = false
  }
}

function onAnomalyPageChange(page: number) {
  anomalyPagination.current = page
  fetchAnomalies()
}

async function decideAnomaly(record: BehaviorAnomaly, action: 'confirm' | 'dismiss') {
  try {
    await (action === 'confirm' ? behaviorApi.confirm(record.id) : behaviorApi.dismiss(record.id))
    Message.success(t('common.updateSuccess'))
    await Promise.all([fetchAnomalies(), fetchStatus()])
  } catch (err: unknown) {
    // 409：终态不可改判（再现会开新案件）
    const e = err as { response?: { data?: { error_code?: string; error?: string } } }
    if (e?.response?.data?.error_code === 'conflict') {
      Message.error(t('behavior.terminalConflict'))
      await fetchAnomalies()
    } else {
      Message.error(e?.response?.data?.error || t('common.operationFail'))
    }
  }
}

// ---- fingerprints tab ----
const fpFilter = reactive<{ status?: string }>({})
const fingerprints = ref<BehaviorFingerprint[]>([])
const fpLoading = ref(false)
const fpError = ref(false)
const fpPagination = reactive({ current: 1, pageSize: 20, total: 0, showTotal: true })

async function fetchFingerprints() {
  fpLoading.value = true
  fpError.value = false
  try {
    const res = await behaviorApi.fingerprints({
      status: fpFilter.status,
      page: fpPagination.current,
      page_size: fpPagination.pageSize,
    })
    fingerprints.value = res.data ?? []
    fpPagination.total = res.total
  } catch {
    fpError.value = true
  } finally {
    fpLoading.value = false
  }
}

function onFpPageChange(page: number) {
  fpPagination.current = page
  fetchFingerprints()
}

async function decideFingerprint(record: BehaviorFingerprint, action: 'approve' | 'retire') {
  try {
    await (action === 'approve'
      ? behaviorApi.approveFingerprint(record.id)
      : behaviorApi.retireFingerprint(record.id))
    Message.success(t('common.updateSuccess'))
    await Promise.all([fetchFingerprints(), fetchStatus()])
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error_code?: string; error?: string } } }
    if (e?.response?.data?.error_code === 'conflict') {
      Message.error(t('behavior.terminalConflict'))
      await fetchFingerprints()
    } else {
      Message.error(e?.response?.data?.error || t('common.operationFail'))
    }
  }
}

// ---- coverage tab ----
const coverage = ref<BehaviorCoverageRow[]>([])
const coverageLoading = ref(false)

async function fetchCoverage() {
  coverageLoading.value = true
  try {
    const res = await behaviorApi.coverage()
    coverage.value = res.data ?? []
  } catch {
    coverage.value = []
  } finally {
    coverageLoading.value = false
  }
}

function onTabChange(key: string | number) {
  if (key === 'fingerprints' && !fingerprints.value.length) fetchFingerprints()
  if (key === 'coverage' && !coverage.value.length) fetchCoverage()
}

// ---- dimensions / template viewer ----
const dimsVisible = ref(false)
const dimsText = ref('')

function prettyDimensions(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function showDimensions(record: BehaviorAnomaly | BehaviorFingerprint) {
  const raw = 'dimensions' in record && record.dimensions ? record.dimensions : record.template
  dimsText.value = prettyDimensions(raw ?? '')
  dimsVisible.value = true
}

function bandColor(band: string): string {
  const map: Record<string, string> = { suspicious: 'gold', anomalous: 'orange', critical: 'red' }
  return map[band] || 'blue'
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    open: 'arcoblue',
    confirmed: 'red',
    dismissed: 'gray',
    expired: 'gray',
  }
  return map[status] || 'blue'
}

onMounted(() => {
  fetchStatus()
  fetchAnomalies()
})
</script>

<style scoped lang="less">
.behavior-page {
  .status-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .status-item {
      color: var(--color-text-2);
      font-size: 13px;
    }
  }

  .mono {
    font-family: var(--cl-font-mono);
    font-size: 12px;
  }

  .muted {
    color: var(--color-text-4);
    font-size: 12px;
  }

  .dims-block {
    max-height: 320px;
    overflow: auto;
    padding: 12px;
    margin: 4px 0;
    font-family: var(--cl-font-mono);
    font-size: 12px;
    background: var(--color-fill-2);
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-all;

    &.modal {
      max-height: 480px;
    }
  }
}
</style>

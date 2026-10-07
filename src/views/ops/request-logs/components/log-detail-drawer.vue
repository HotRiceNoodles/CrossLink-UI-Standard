<template>
  <a-drawer
    :visible="visible"
    :width="720"
    unmount-on-close
    @cancel="emit('update:visible', false)"
  >
    <template #title>
      <div v-if="log" class="drawer-title-row">
        <div class="drawer-title-left">
          <span class="drawer-request-id">{{ viewLog.request_id }}</span>
          <a-button size="mini" type="text" @click="handleCopy(viewLog.request_id)">
            <template #icon><icon-copy /></template>
          </a-button>
        </div>
        <a-tag :color="statusCodeColor(viewLog.status_code)" size="large">
          {{ viewLog.status_code }} {{ statusLabel(viewLog.status_code) }}
        </a-tag>
      </div>
    </template>

    <template v-if="viewLog">
      <div class="drawer-subtitle">{{ formatTime(viewLog.created_at) }}</div>

      <!-- 404：日志不存在或已被删除 -->
      <div v-if="detailError === 'not_found'" class="content-empty">
        {{ t('logDetail.notFound') }}
      </div>

      <template v-else>
        <!-- 详情加载失败（非 404）：警告横幅，保留列表行种子数据 -->
        <a-alert v-if="detailError === 'error'" type="warning" class="load-fail-alert">
          {{ t('logDetail.loadFail') }}
        </a-alert>

        <a-spin :loading="detailLoading" style="width: 100%">
          <!-- 基本信息 -->
          <a-card class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-file />
                {{ t('logDetail.basicInfo') }}
              </span>
            </template>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.routeType') }}</span>
              <span class="detail-value">{{ viewLog.route_type }}</span>
            </div>
            <div v-if="viewLog.error_type" class="detail-row">
              <span class="detail-label">{{ t('logDetail.errorType') }}</span>
              <span class="detail-value">
                <a-tag color="red" size="small">{{ viewLog.error_type }}</a-tag>
              </span>
            </div>
            <div v-if="viewLog.agent_type" class="detail-row">
              <span class="detail-label">{{ t('logDetail.agentType') }}</span>
              <span class="detail-value">{{ viewLog.agent_type }}</span>
            </div>
          </a-card>

          <!-- 用量统计 -->
          <a-card class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-bar-chart />
                {{ t('logDetail.usageStats') }}
              </span>
            </template>
            <div class="usage-overview">
              <div class="usage-metric">
                <span class="usage-metric-value">
                  {{ formatTokensLocale(viewLog.input_tokens + viewLog.output_tokens) }}
                </span>
                <span class="usage-metric-label">{{ t('logDetail.totalTokens') }}</span>
              </div>
              <div class="usage-metric">
                <span class="usage-metric-value">
                  {{ getCurrencySymbol(viewLog.currency)
                  }}{{ viewLog.cost != null ? viewLog.cost.toFixed(4) : '-' }}
                </span>
                <span class="usage-metric-label">
                  {{ t('logDetail.costWithCurrency', { currency: viewLog.currency }) }}
                </span>
              </div>
              <div v-if="viewLog.billable_cost != null" class="usage-metric">
                <span class="usage-metric-value">
                  {{ getCurrencySymbol(viewLog.currency) }}{{ viewLog.billable_cost.toFixed(4) }}
                </span>
                <span class="usage-metric-label">
                  <a-tooltip :content="billableHint">
                    <span>{{ t('logDetail.billableCost', { currency: viewLog.currency }) }}</span>
                  </a-tooltip>
                </span>
              </div>
            </div>
            <div v-if="totalTokens > 0" class="token-bar-group">
              <div class="token-bar-item">
                <span class="token-bar-label">{{ t('logDetail.input') }}</span>
                <div class="token-bar-track">
                  <div
                    class="token-bar-fill bar-input"
                    :style="{ width: inputPercent + '%' }"
                  ></div>
                </div>
                <span class="token-bar-value">
                  {{ formatTokensLocale(viewLog.input_tokens) }} ({{ inputPercent }}%)
                </span>
              </div>
              <div class="token-bar-item">
                <span class="token-bar-label">{{ t('logDetail.output') }}</span>
                <div class="token-bar-track">
                  <div
                    class="token-bar-fill bar-output"
                    :style="{ width: outputPercent + '%' }"
                  ></div>
                </div>
                <span class="token-bar-value">
                  {{ formatTokensLocale(viewLog.output_tokens) }} ({{ outputPercent }}%)
                </span>
              </div>
            </div>
          </a-card>

          <!-- Token 分析（详情接口专属；null = 未分析） -->
          <a-card v-if="hasTokenAnalysis" class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-layers />
                {{ t('logDetail.tokenAnalysis') }}
              </span>
            </template>
            <div v-for="bucket in tokenBuckets" :key="bucket.label" class="detail-row">
              <span class="detail-label">{{ bucket.label }}</span>
              <span v-if="bucket.value != null" class="detail-value">
                {{ formatTokensLocale(bucket.value) }}
              </span>
              <span v-else class="detail-value not-analyzed">{{ t('logDetail.notAnalyzed') }}</span>
            </div>
            <div
              v-if="viewLog.context_utilization_bp != null"
              class="token-bar-item context-bar-item"
            >
              <span class="token-bar-label context-bar-label">
                {{ t('logDetail.contextUtilization') }}
              </span>
              <div class="token-bar-track">
                <div
                  class="token-bar-fill bar-context"
                  :style="{ width: contextUtilPercent + '%' }"
                ></div>
              </div>
              <span class="token-bar-value">{{ contextUtilPercent.toFixed(1) }}%</span>
            </div>
            <div v-if="viewLog.context_window != null" class="detail-row">
              <span class="detail-label">{{ t('logDetail.contextWindow') }}</span>
              <span class="detail-value">{{ formatTokensLocale(viewLog.context_window) }}</span>
            </div>
            <div v-if="viewLog.analysis_flags != null" class="detail-row">
              <span class="detail-label">{{ t('logDetail.analysisFlags') }}</span>
              <span class="detail-value mono">{{ viewLog.analysis_flags }}</span>
            </div>
            <div v-if="viewLog.context_snapshot" class="security-collapse">
              <a-collapse :default-active-key="[]" :bordered="false">
                <a-collapse-item key="snapshot" :header="t('logDetail.contextSnapshot')">
                  <pre class="content-block">{{
                    JSON.stringify(viewLog.context_snapshot, null, 2)
                  }}</pre>
                </a-collapse-item>
              </a-collapse>
            </div>
          </a-card>

          <!-- 图片信息（image_count 为 null 表示非图片请求，整卡隐藏） -->
          <a-card v-if="viewLog.image_count != null" class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-image />
                {{ t('logDetail.imageInfo') }}
              </span>
            </template>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.imageCount') }}</span>
              <span class="detail-value">{{ formatTokensLocale(viewLog.image_count) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.imageSize') }}</span>
              <span class="detail-value">{{ viewLog.image_size || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.imageQuality') }}</span>
              <span class="detail-value">{{ viewLog.image_quality || '-' }}</span>
            </div>
          </a-card>

          <!-- 模型与路由 -->
          <a-card class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-swap />
                {{ t('logDetail.modelAndRouting') }}
              </span>
            </template>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.requestModel') }}</span>
              <span class="detail-value mono bold">{{ viewLog.model_requested }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.actualModel') }}</span>
              <span class="detail-value">
                <template
                  v-if="viewLog.model_used && viewLog.model_used !== viewLog.model_requested"
                >
                  <a-tooltip :content="t('logDetail.modelFallback')">
                    <a-tag color="orangered" size="small">{{ viewLog.model_used }}</a-tag>
                  </a-tooltip>
                </template>
                <template v-else>{{ viewLog.model_used || '-' }}</template>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.provider') }}</span>
              <span class="detail-value">{{ providerName(viewLog.provider_id) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.apiKey') }}</span>
              <span class="detail-value">{{ keyName(viewLog.api_key_id) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.team') }}</span>
              <span class="detail-value">{{ viewLog.team_id ?? '-' }}</span>
            </div>
          </a-card>

          <!-- 性能指标 -->
          <a-card class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-thunderbolt />
                {{ t('logDetail.performanceMetrics') }}
              </span>
            </template>
            <div class="perf-bar-item">
              <span class="perf-bar-label">{{ t('logDetail.totalLatency') }}</span>
              <div class="perf-bar-track">
                <div
                  class="perf-bar-fill"
                  :class="latencyBarClass(viewLog.latency_ms)"
                  :style="{ width: latencyPercent(viewLog.latency_ms) + '%' }"
                ></div>
              </div>
              <span class="perf-bar-value">{{ formatLatency(viewLog.latency_ms) }}</span>
            </div>
            <div class="perf-bar-item">
              <span class="perf-bar-label">{{ t('logDetail.firstToken') }}</span>
              <div class="perf-bar-track">
                <div
                  class="perf-bar-fill bar-ttft"
                  :style="{ width: latencyPercent(viewLog.first_token_ms ?? 0) + '%' }"
                ></div>
              </div>
              <span class="perf-bar-value">
                {{ viewLog.first_token_ms != null ? `${viewLog.first_token_ms}ms` : '-' }}
              </span>
            </div>
          </a-card>

          <!-- 容错与缓存 -->
          <a-card class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-sync />
                {{ t('logDetail.faultTolerance') }}
              </span>
            </template>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.fallbackCount') }}</span>
              <span class="detail-value">
                <a-tag v-if="viewLog.fallback_count > 0" color="orangered" size="small">
                  {{ viewLog.fallback_count }}
                </a-tag>
                <span v-else>0</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.retryCount') }}</span>
              <span class="detail-value">
                <a-tag v-if="viewLog.retry_count > 0" color="orangered" size="small">
                  {{ viewLog.retry_count }}
                </a-tag>
                <span v-else>0</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.cacheHit') }}</span>
              <span class="detail-value">
                <a-tag v-if="viewLog.cache_hit" color="green" size="small">
                  {{ t('common.yes') }}
                </a-tag>
                <a-tag v-else color="gray" size="small">{{ t('common.no') }}</a-tag>
              </span>
            </div>
          </a-card>

          <!-- 安全与内容 -->
          <a-card class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-safe />
                {{ t('logDetail.security') }}
              </span>
            </template>
            <div class="detail-row">
              <span class="detail-label">{{ t('logDetail.guardrailTriggered') }}</span>
              <span class="detail-value">
                <a-tag v-if="viewLog.guardrail_triggered" color="red" size="small">
                  {{ t('common.yes') }}
                </a-tag>
                <span v-else>{{ t('common.no') }}</span>
              </span>
            </div>
            <div v-if="viewLog.guardrail_rule" class="detail-row">
              <span class="detail-label">{{ t('logDetail.guardrailRule') }}</span>
              <span class="detail-value">{{ viewLog.guardrail_rule }}</span>
            </div>
            <div v-if="viewLog.security_events?.length" class="security-collapse">
              <a-collapse :default-active-key="[]" :bordered="false">
                <a-collapse-item key="events" :header="t('logDetail.securityEvents')">
                  <pre class="content-block">{{
                    JSON.stringify(viewLog.security_events, null, 2)
                  }}</pre>
                </a-collapse-item>
              </a-collapse>
            </div>
          </a-card>

          <!-- 请求/响应内容 -->
          <a-card class="detail-section" :bordered="false">
            <template #title>
              <span class="section-title">
                <icon-code />
                {{ t('logDetail.requestResponseContent') }}
              </span>
            </template>
            <!-- 无正文时按内容日志开关状态区分：未开启 vs 历史记录（产生于开启之前） -->
            <div v-if="!hasContent" class="content-empty">
              <template v-if="contentLogEnabled === false">
                <span>{{ t('logDetail.contentLogDisabled') }}</span>
                <a-link v-if="canOpenSettings" @click="goSettings">
                  {{ t('logDetail.goSettings') }}
                </a-link>
              </template>
              <span v-else-if="contentLogEnabled === true">{{ t('logDetail.contentLegacy') }}</span>
              <span v-else>{{ t('logDetail.contentUnknown') }}</span>
            </div>
            <a-collapse v-else :default-active-key="[]" :bordered="false">
              <a-collapse-item
                v-if="viewLog.user_message"
                key="req"
                :header="t('logDetail.requestContent')"
              >
                <template #extra>
                  <a-button size="mini" type="text" @click.stop="handleCopy(viewLog.user_message!)">
                    <template #icon><icon-copy /></template>
                  </a-button>
                </template>
                <pre class="content-block">{{ formatContent(viewLog.user_message) }}</pre>
              </a-collapse-item>
              <a-collapse-item
                v-if="viewLog.model_response"
                key="res"
                :header="t('logDetail.responseContent')"
              >
                <template #extra>
                  <a-button
                    size="mini"
                    type="text"
                    @click.stop="handleCopy(viewLog.model_response!)"
                  >
                    <template #icon><icon-copy /></template>
                  </a-button>
                </template>
                <pre class="content-block">{{ formatContent(viewLog.model_response) }}</pre>
              </a-collapse-item>
            </a-collapse>
          </a-card>
        </a-spin>
      </template>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Message } from '@arco-design/web-vue'
import type { UsageLog } from '@/types'
import { getCurrencySymbol } from '@/utils/currency'
import { copyToClipboard } from '@/utils/clipboard'
import { formatLatency, formatTokensLocale } from '@/utils/format'
import { settingsApi } from '@/api/settings'
import { usageApi } from '@/api/usage'
import { useUserStore } from '@/store/modules/user'

const props = defineProps<{
  visible: boolean
  log: UsageLog | null
  providerOptions: { label: string; value: number }[]
  keyOptions: { label: string; value: number }[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

// 详情拉取：列表接口已不返回内容字段，抽屉打开时用列表行作种子先渲染，
// 再整体替换为 GET /usage/:id 的完整详情
const detail = ref<UsageLog | null>(null)
const detailLoading = ref(false)
const detailError = ref<'not_found' | 'error' | null>(null)

// 渲染目标：详情优先，列表行兜底（抽屉秒开，详情到达后新区块弹出）
const viewLog = computed(() => detail.value ?? props.log)
// 竞态守卫：快速连点不同行时丢弃过期响应
let fetchSeq = 0

watch(
  () => [props.visible, props.log?.id] as const,
  ([visible]) => {
    if (!visible || !props.log) return
    const seq = ++fetchSeq
    detail.value = null
    detailError.value = null
    detailLoading.value = true
    usageApi
      .requestLogDetail(props.log.id)
      .then((res) => {
        if (seq !== fetchSeq) return
        detail.value = res.data
        // 拉到的详情仍无内容 → 查内容日志开关，区分「未开启」与「历史记录」
        if (!res.data.user_message && !res.data.model_response) fetchContentLogSetting()
      })
      .catch((err: { response?: { status?: number } }) => {
        if (seq !== fetchSeq) return
        detailError.value = err?.response?.status === 404 ? 'not_found' : 'error'
      })
      .finally(() => {
        if (seq === fetchSeq) detailLoading.value = false
      })
  },
  { immediate: true },
)

// 内容日志：无正文时拉取当前开关，区分「未开启」与「历史记录（产生于开启之前）」两种情况
const hasContent = computed(() => !!(viewLog.value?.user_message || viewLog.value?.model_response))
const canOpenSettings = computed(() => userStore.hasPermission('system:view'))
// null = 拉取失败或无权限（如企业版组织用户），用中性文案兜底
const contentLogEnabled = ref<boolean | null>(null)

function fetchContentLogSetting() {
  contentLogEnabled.value = null
  settingsApi
    .getContentLog()
    .then((res) => {
      contentLogEnabled.value = res.data.enabled
    })
    .catch(() => {
      contentLogEnabled.value = null
    })
}

function goSettings() {
  router.push({ name: 'settings' })
}

// Computed — token usage
const totalTokens = computed(
  () => (viewLog.value?.input_tokens ?? 0) + (viewLog.value?.output_tokens ?? 0),
)
const inputPercent = computed(() => {
  const total = totalTokens.value
  if (total === 0) return 0
  return Math.round(((viewLog.value?.input_tokens ?? 0) / total) * 100)
})
const outputPercent = computed(() => 100 - inputPercent.value)

// Computed — token 分析（null = 未分析，区别于 0）
const tokenBuckets = computed(() => [
  { label: t('logDetail.tokenReasoning'), value: viewLog.value?.reasoning_tokens },
  { label: t('logDetail.tokenSystem'), value: viewLog.value?.system_tokens },
  { label: t('logDetail.tokenHistory'), value: viewLog.value?.history_tokens },
  { label: t('logDetail.tokenQuestion'), value: viewLog.value?.question_tokens },
  { label: t('logDetail.tokenTool'), value: viewLog.value?.tool_tokens },
  { label: t('logDetail.tokenToolOutput'), value: viewLog.value?.tool_output_tokens },
])
const hasTokenAnalysis = computed(() => {
  const log = viewLog.value
  if (!log) return false
  return [
    log.reasoning_tokens,
    log.system_tokens,
    log.history_tokens,
    log.question_tokens,
    log.tool_tokens,
    log.tool_output_tokens,
    log.context_window,
    log.context_utilization_bp,
    log.analysis_flags,
  ].some((v) => v != null)
})
// 基点 → 百分比（6540bp = 65.4%），显示上限 clamp 到 100
const contextUtilPercent = computed(() => {
  const bp = viewLog.value?.context_utilization_bp
  if (bp == null) return 0
  return Math.min(100, bp / 100)
})

// 计费费用提示：公式 + 由 billable_cost / cost 推导的 Key 单价倍率
const billableHint = computed(() => {
  const base = t('logDetail.billableCostHint')
  const log = viewLog.value
  if (!log || log.billable_cost == null || !(log.cost > 0)) return base
  return `${base} (×${(log.billable_cost / log.cost).toFixed(2)})`
})

// Status
function statusLabel(code: number): string {
  if (code >= 200 && code < 300) return t('logDetail.statusSuccess')
  if (code === 429) return t('logDetail.statusRateLimit')
  if (code >= 400 && code < 500) return t('logDetail.statusClientError')
  if (code >= 500) return t('logDetail.statusServerError')
  return ''
}

function statusCodeColor(code: number): string {
  if (code >= 200 && code < 300) return 'green'
  if (code === 429) return 'purple'
  if (code >= 400 && code < 500) return 'orange'
  if (code >= 500) return 'red'
  return 'gray'
}

// Clipboard
async function handleCopy(text: string) {
  try {
    await copyToClipboard(text)
    Message.success(t('common.copied'))
  } catch {
    Message.error(t('common.copyFail'))
  }
}

// ID → name mapping
function providerName(id: number | null | undefined): string {
  if (id == null) return '-'
  const opt = props.providerOptions.find((o) => o.value === id)
  return opt ? opt.label : String(id)
}

function keyName(id: number | null | undefined): string {
  if (id == null) return '-'
  const opt = props.keyOptions.find((o) => o.value === id)
  return opt ? opt.label : String(id)
}

// Latency bar helpers (threshold: 5s = 100%)
function latencyPercent(ms: number): number {
  return Math.min(100, (ms / 5000) * 100)
}

function latencyBarClass(ms: number): string {
  if (ms < 1000) return 'bar-fast'
  if (ms < 3000) return 'bar-medium'
  return 'bar-slow'
}

// Content formatter (auto-detect JSON)
function formatContent(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return content
  }
}

// Shared formatters
function formatTime(val: string) {
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style scoped lang="less">
// Drawer header
.drawer-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-inline-end: 24px;
}

.drawer-title-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.drawer-request-id {
  font-family: monospace;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.drawer-subtitle {
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-fill-2);
}

// Section title with icon
.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

// Detail sections
.detail-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;

  & + .detail-row {
    border-top: 1px solid var(--color-fill-2);
  }
}

.detail-label {
  color: var(--color-text-3);
  flex-shrink: 0;
}

.detail-value {
  color: var(--color-text-1);
  text-align: end;
  word-break: break-all;

  &.mono {
    font-family: monospace;
    font-size: 12px;
  }

  &.bold {
    font-weight: 600;
  }
}

// Usage overview — big numbers
.usage-overview {
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-fill-2);
}

.usage-metric {
  display: flex;
  flex-direction: column;
}

.usage-metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-1);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.usage-metric-label {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 2px;
}

// Token progress bars
.token-bar-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-bar-label {
  font-size: 12px;
  color: var(--color-text-3);
  min-width: 28px;
}

.token-bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-fill-2);
  border-radius: 4px;
  overflow: hidden;
}

.token-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;

  &.bar-input {
    background: rgb(var(--arcoblue-6));
  }

  &.bar-output {
    background: rgb(var(--green-6));
  }
}

.token-bar-value {
  font-size: 12px;
  color: var(--color-text-2);
  min-width: 120px;
  text-align: end;
  font-variant-numeric: tabular-nums;
}

// Performance bars
.perf-bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;

  & + .perf-bar-item {
    border-top: 1px solid var(--color-fill-2);
  }
}

.perf-bar-label {
  font-size: 12px;
  color: var(--color-text-3);
  min-width: 48px;
}

.perf-bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-fill-2);
  border-radius: 4px;
  overflow: hidden;
}

.perf-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;

  &.bar-fast {
    background: rgb(var(--green-6));
  }

  &.bar-medium {
    background: rgb(var(--orange-6));
  }

  &.bar-slow {
    background: rgb(var(--red-6));
  }

  &.bar-ttft {
    background: rgb(var(--arcoblue-6));
  }
}

.perf-bar-value {
  font-size: 13px;
  color: var(--color-text-1);
  font-weight: 500;
  min-width: 64px;
  text-align: end;
  font-variant-numeric: tabular-nums;
}

// Security collapse
.security-collapse {
  margin-top: 8px;
}

// Content block (code / JSON display)
.content-block {
  margin: 0;
  padding: 12px;
  background: var(--color-fill-2);
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

// Empty-content hint (content logging off or legacy record)
.content-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  font-size: 13px;
  color: var(--color-text-3);
}

// Detail fetch failure banner
.load-fail-alert {
  margin-bottom: 16px;
}

// Token bucket not analyzed (null)
.not-analyzed {
  color: var(--color-text-4);
}

// Context utilization bar (reuses token-bar layout, wider label)
.context-bar-item {
  padding: 8px 0;
  border-top: 1px solid var(--color-fill-2);
}

.context-bar-label {
  min-width: 96px;
}

.bar-context {
  background: rgb(var(--purple-6));
}
</style>

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
          <span class="drawer-request-id">{{ log.request_id }}</span>
          <a-button size="mini" type="text" @click="handleCopy(log.request_id)">
            <template #icon><icon-copy /></template>
          </a-button>
        </div>
        <a-tag :color="statusCodeColor(log.status_code)" size="large">
          {{ log.status_code }} {{ statusLabel(log.status_code) }}
        </a-tag>
      </div>
    </template>

    <template v-if="log">
      <div class="drawer-subtitle">{{ formatTime(log.created_at) }}</div>

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
          <span class="detail-value">{{ log.route_type }}</span>
        </div>
        <div v-if="log.error_type" class="detail-row">
          <span class="detail-label">{{ t('logDetail.errorType') }}</span>
          <span class="detail-value">
            <a-tag color="red" size="small">{{ log.error_type }}</a-tag>
          </span>
        </div>
        <div v-if="log.agent_type" class="detail-row">
          <span class="detail-label">{{ t('logDetail.agentType') }}</span>
          <span class="detail-value">{{ log.agent_type }}</span>
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
              {{ formatTokensLocale(log.input_tokens + log.output_tokens) }}
            </span>
            <span class="usage-metric-label">{{ t('logDetail.totalTokens') }}</span>
          </div>
          <div class="usage-metric">
            <span class="usage-metric-value">
              {{ getCurrencySymbol(log.currency)
              }}{{ log.cost != null ? log.cost.toFixed(4) : '-' }}
            </span>
            <span class="usage-metric-label">
              {{ t('logDetail.costWithCurrency', { currency: log.currency }) }}
            </span>
          </div>
        </div>
        <div v-if="totalTokens > 0" class="token-bar-group">
          <div class="token-bar-item">
            <span class="token-bar-label">{{ t('logDetail.input') }}</span>
            <div class="token-bar-track">
              <div class="token-bar-fill bar-input" :style="{ width: inputPercent + '%' }"></div>
            </div>
            <span class="token-bar-value">
              {{ formatTokensLocale(log.input_tokens) }} ({{ inputPercent }}%)
            </span>
          </div>
          <div class="token-bar-item">
            <span class="token-bar-label">{{ t('logDetail.output') }}</span>
            <div class="token-bar-track">
              <div class="token-bar-fill bar-output" :style="{ width: outputPercent + '%' }"></div>
            </div>
            <span class="token-bar-value">
              {{ formatTokensLocale(log.output_tokens) }} ({{ outputPercent }}%)
            </span>
          </div>
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
          <span class="detail-value mono bold">{{ log.model_requested }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ t('logDetail.actualModel') }}</span>
          <span class="detail-value">
            <template v-if="log.model_used && log.model_used !== log.model_requested">
              <a-tooltip :content="t('logDetail.modelFallback')">
                <a-tag color="orangered" size="small">{{ log.model_used }}</a-tag>
              </a-tooltip>
            </template>
            <template v-else>{{ log.model_used || '-' }}</template>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ t('logDetail.provider') }}</span>
          <span class="detail-value">{{ providerName(log.provider_id) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ t('logDetail.apiKey') }}</span>
          <span class="detail-value">{{ keyName(log.api_key_id) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ t('logDetail.team') }}</span>
          <span class="detail-value">{{ log.team_id ?? '-' }}</span>
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
              :class="latencyBarClass(log.latency_ms)"
              :style="{ width: latencyPercent(log.latency_ms) + '%' }"
            ></div>
          </div>
          <span class="perf-bar-value">{{ formatLatency(log.latency_ms) }}</span>
        </div>
        <div class="perf-bar-item">
          <span class="perf-bar-label">{{ t('logDetail.firstToken') }}</span>
          <div class="perf-bar-track">
            <div
              class="perf-bar-fill bar-ttft"
              :style="{ width: latencyPercent(log.first_token_ms ?? 0) + '%' }"
            ></div>
          </div>
          <span class="perf-bar-value">
            {{ log.first_token_ms != null ? `${log.first_token_ms}ms` : '-' }}
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
            <a-tag v-if="log.fallback_count > 0" color="orangered" size="small">
              {{ log.fallback_count }}
            </a-tag>
            <span v-else>0</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ t('logDetail.retryCount') }}</span>
          <span class="detail-value">
            <a-tag v-if="log.retry_count > 0" color="orangered" size="small">
              {{ log.retry_count }}
            </a-tag>
            <span v-else>0</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ t('logDetail.cacheHit') }}</span>
          <span class="detail-value">
            <a-tag v-if="log.cache_hit" color="green" size="small">{{ t('common.yes') }}</a-tag>
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
            <a-tag v-if="log.guardrail_triggered" color="red" size="small">
              {{ t('common.yes') }}
            </a-tag>
            <span v-else>{{ t('common.no') }}</span>
          </span>
        </div>
        <div v-if="log.guardrail_rule" class="detail-row">
          <span class="detail-label">{{ t('logDetail.guardrailRule') }}</span>
          <span class="detail-value">{{ log.guardrail_rule }}</span>
        </div>
        <div v-if="log.security_events?.length" class="security-collapse">
          <a-collapse :default-active-key="[]" :bordered="false">
            <a-collapse-item key="events" :header="t('logDetail.securityEvents')">
              <pre class="content-block">{{ JSON.stringify(log.security_events, null, 2) }}</pre>
            </a-collapse-item>
          </a-collapse>
        </div>
      </a-card>

      <!-- 请求/响应内容 -->
      <a-card
        v-if="log.user_message || log.model_response"
        class="detail-section"
        :bordered="false"
      >
        <template #title>
          <span class="section-title">
            <icon-code />
            {{ t('logDetail.requestResponseContent') }}
          </span>
        </template>
        <a-collapse :default-active-key="[]" :bordered="false">
          <a-collapse-item
            v-if="log.user_message"
            key="req"
            :header="t('logDetail.requestContent')"
          >
            <template #extra>
              <a-button size="mini" type="text" @click.stop="handleCopy(log.user_message!)">
                <template #icon><icon-copy /></template>
              </a-button>
            </template>
            <pre class="content-block">{{ formatContent(log.user_message) }}</pre>
          </a-collapse-item>
          <a-collapse-item
            v-if="log.model_response"
            key="res"
            :header="t('logDetail.responseContent')"
          >
            <template #extra>
              <a-button size="mini" type="text" @click.stop="handleCopy(log.model_response!)">
                <template #icon><icon-copy /></template>
              </a-button>
            </template>
            <pre class="content-block">{{ formatContent(log.model_response) }}</pre>
          </a-collapse-item>
        </a-collapse>
      </a-card>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { Message } from '@arco-design/web-vue'
import type { UsageLog } from '@/types'
import { getCurrencySymbol } from '@/utils/currency'
import { copyToClipboard } from '@/utils/clipboard'
import { formatLatency, formatTokensLocale } from '@/utils/format'

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

// Computed — token usage
const totalTokens = computed(() => (props.log?.input_tokens ?? 0) + (props.log?.output_tokens ?? 0))
const inputPercent = computed(() => {
  const total = totalTokens.value
  if (total === 0) return 0
  return Math.round(((props.log?.input_tokens ?? 0) / total) * 100)
})
const outputPercent = computed(() => 100 - inputPercent.value)

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
  padding-right: 24px;
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
  text-align: right;
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
  text-align: right;
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
  text-align: right;
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
</style>

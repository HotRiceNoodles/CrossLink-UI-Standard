<template>
  <a-drawer
    :visible="visible"
    :width="720"
    unmount-on-close
    @cancel="emit('update:visible', false)"
  >
    <template #title>
      <div class="drawer-title-row" v-if="log">
        <div class="drawer-title-left">
          <span class="drawer-request-id">{{ log.request_id }}</span>
          <a-button size="mini" type="text" @click="copyToClipboard(log.request_id)">
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
          <span class="section-title"><icon-file-text /> 基本信息</span>
        </template>
        <div class="detail-row">
          <span class="detail-label">路由类型</span>
          <span class="detail-value">{{ log.route_type }}</span>
        </div>
        <div class="detail-row" v-if="log.error_type">
          <span class="detail-label">错误类型</span>
          <span class="detail-value">
            <a-tag color="red" size="small">{{ log.error_type }}</a-tag>
          </span>
        </div>
        <div class="detail-row" v-if="log.agent_type">
          <span class="detail-label">Agent 类型</span>
          <span class="detail-value">{{ log.agent_type }}</span>
        </div>
      </a-card>

      <!-- 用量统计 -->
      <a-card class="detail-section" :bordered="false">
        <template #title>
          <span class="section-title"><icon-bar-chart /> 用量统计</span>
        </template>
        <div class="usage-overview">
          <div class="usage-metric">
            <span class="usage-metric-value">{{ formatTokens(log.input_tokens + log.output_tokens) }}</span>
            <span class="usage-metric-label">总 Token</span>
          </div>
          <div class="usage-metric">
            <span class="usage-metric-value">&yen;{{ log.cost != null ? log.cost.toFixed(4) : '-' }}</span>
            <span class="usage-metric-label">费用 ({{ log.currency }})</span>
          </div>
        </div>
        <div v-if="totalTokens > 0" class="token-bar-group">
          <div class="token-bar-item">
            <span class="token-bar-label">输入</span>
            <div class="token-bar-track">
              <div class="token-bar-fill bar-input" :style="{ width: inputPercent + '%' }"></div>
            </div>
            <span class="token-bar-value">{{ formatTokens(log.input_tokens) }} ({{ inputPercent }}%)</span>
          </div>
          <div class="token-bar-item">
            <span class="token-bar-label">输出</span>
            <div class="token-bar-track">
              <div class="token-bar-fill bar-output" :style="{ width: outputPercent + '%' }"></div>
            </div>
            <span class="token-bar-value">{{ formatTokens(log.output_tokens) }} ({{ outputPercent }}%)</span>
          </div>
        </div>
      </a-card>

      <!-- 模型与路由 -->
      <a-card class="detail-section" :bordered="false">
        <template #title>
          <span class="section-title"><icon-swap /> 模型与路由</span>
        </template>
        <div class="detail-row">
          <span class="detail-label">请求模型</span>
          <span class="detail-value mono bold">{{ log.model_requested }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">实际模型</span>
          <span class="detail-value">
            <template v-if="log.model_used && log.model_used !== log.model_requested">
              <a-tooltip content="模型发生 fallback">
                <a-tag color="orangered" size="small">{{ log.model_used }}</a-tag>
              </a-tooltip>
            </template>
            <template v-else>{{ log.model_used || '-' }}</template>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Provider</span>
          <span class="detail-value">{{ providerName(log.provider_id) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">API Key</span>
          <span class="detail-value">{{ keyName(log.api_key_id) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Team</span>
          <span class="detail-value">{{ log.team_id ?? '-' }}</span>
        </div>
      </a-card>

      <!-- 性能指标 -->
      <a-card class="detail-section" :bordered="false">
        <template #title>
          <span class="section-title"><icon-thunderbolt /> 性能指标</span>
        </template>
        <div class="perf-bar-item">
          <span class="perf-bar-label">总耗时</span>
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
          <span class="perf-bar-label">首 Token</span>
          <div class="perf-bar-track">
            <div
              class="perf-bar-fill bar-ttft"
              :style="{ width: latencyPercent(log.first_token_ms ?? 0) + '%' }"
            ></div>
          </div>
          <span class="perf-bar-value">{{ log.first_token_ms != null ? `${log.first_token_ms}ms` : '-' }}</span>
        </div>
      </a-card>

      <!-- 容错与缓存 -->
      <a-card class="detail-section" :bordered="false">
        <template #title>
          <span class="section-title"><icon-sync /> 容错与缓存</span>
        </template>
        <div class="detail-row">
          <span class="detail-label">Fallback 次数</span>
          <span class="detail-value">
            <a-tag v-if="log.fallback_count > 0" color="orangered" size="small">{{ log.fallback_count }}</a-tag>
            <span v-else>0</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">重试次数</span>
          <span class="detail-value">
            <a-tag v-if="log.retry_count > 0" color="orangered" size="small">{{ log.retry_count }}</a-tag>
            <span v-else>0</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">缓存命中</span>
          <span class="detail-value">
            <a-tag v-if="log.cache_hit" color="green" size="small">是</a-tag>
            <a-tag v-else color="gray" size="small">否</a-tag>
          </span>
        </div>
      </a-card>

      <!-- 安全与内容 -->
      <a-card class="detail-section" :bordered="false">
        <template #title>
          <span class="section-title"><icon-safe /> 安全与内容</span>
        </template>
        <div class="detail-row">
          <span class="detail-label">Guardrail 触发</span>
          <span class="detail-value">
            <a-tag v-if="log.guardrail_triggered" color="red" size="small">是</a-tag>
            <span v-else>否</span>
          </span>
        </div>
        <div class="detail-row" v-if="log.guardrail_rule">
          <span class="detail-label">Guardrail 规则</span>
          <span class="detail-value">{{ log.guardrail_rule }}</span>
        </div>
        <div v-if="log.security_events?.length" class="security-collapse">
          <a-collapse :default-active-key="[]" :bordered="false">
            <a-collapse-item header="安全事件" key="events">
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
          <span class="section-title"><icon-code /> 请求/响应内容</span>
        </template>
        <a-collapse :default-active-key="[]" :bordered="false">
          <a-collapse-item v-if="log.user_message" header="请求内容" key="req">
            <template #extra>
              <a-button size="mini" type="text" @click.stop="copyToClipboard(log.user_message!)">
                <template #icon><icon-copy /></template>
              </a-button>
            </template>
            <pre class="content-block">{{ formatContent(log.user_message) }}</pre>
          </a-collapse-item>
          <a-collapse-item v-if="log.model_response" header="响应内容（可能不完整）" key="res">
            <template #extra>
              <a-button size="mini" type="text" @click.stop="copyToClipboard(log.model_response!)">
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
import dayjs from 'dayjs'
import { Message } from '@arco-design/web-vue'
import type { UsageLog } from '@/types'

const props = defineProps<{
  visible: boolean
  log: UsageLog | null
  providerOptions: { label: string; value: number }[]
  keyOptions: { label: string; value: number }[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

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
  if (code >= 200 && code < 300) return '成功'
  if (code === 429) return '限流'
  if (code >= 400 && code < 500) return '客户端错误'
  if (code >= 500) return '服务端错误'
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
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    Message.success('已复制')
  } catch {
    Message.error('复制失败')
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

function formatTokens(val: number) {
  return val.toLocaleString()
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
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

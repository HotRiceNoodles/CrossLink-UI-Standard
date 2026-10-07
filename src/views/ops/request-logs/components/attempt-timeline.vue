<template>
  <div class="attempt-timeline">
    <div
      v-for="(attempt, i) in attempts"
      :key="i"
      class="attempt-item"
      :class="{ failed: !attempt.success }"
    >
      <div class="attempt-rail">
        <span class="attempt-dot" :class="attempt.success ? 'dot-success' : 'dot-fail'"></span>
      </div>
      <div class="attempt-card">
        <div class="attempt-header">
          <span class="attempt-index">{{ t('requestDebug.attempt', [i + 1]) }}</span>
          <a-tag color="arcoblue" size="small">{{ attempt.provider }}</a-tag>
          <span class="attempt-model">{{ attempt.model }}</span>
          <a-tag v-if="attempt.success" color="green" size="small">
            {{ t('requestDebug.statusSuccess') }}
          </a-tag>
          <a-tag v-else color="red" size="small">{{ t('requestDebug.statusFail') }}</a-tag>
          <a-tooltip v-if="attempt.persistent" :content="t('logDetail.attemptPersistentHint')">
            <a-tag color="orange" size="small">{{ t('logDetail.attemptPersistent') }}</a-tag>
          </a-tooltip>
        </div>
        <div class="attempt-meta">
          <a-tag
            v-if="attempt.error_type"
            size="small"
            class="attempt-error-type"
            :color="ERROR_TYPE_COLORS[attempt.error_type] || 'gray'"
          >
            {{ attempt.error_type }}
          </a-tag>
          <span
            v-if="attempt.upstream_status"
            class="status-pill"
            :class="statusClass(attempt.upstream_status)"
          >
            {{ attempt.upstream_status }}
          </span>
          <span v-else-if="!attempt.success" class="no-response">
            {{ t('logDetail.attemptNoResponse') }}
          </span>
          <span class="attempt-latency">{{ formatLatency(attempt.latency_ms) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UsageAttempt } from '@/types'
import { formatLatency, statusClass } from '@/utils/format'

defineProps<{
  attempts: UsageAttempt[]
}>()

const { t } = useI18n()

// attempts 内的 error_type 是机器分类枚举，直接显示原始值 + 颜色区分，
// 不做本地化（避免与日志顶层 error_type 分类体系混淆）
const ERROR_TYPE_COLORS: Record<string, string> = {
  rate_limit: 'orange',
  auth: 'red',
  not_found: 'orangered',
  bad_request: 'orangered',
  server: 'red',
  quota: 'red',
  network: 'gray',
  timeout: 'gray',
}
</script>

<script lang="ts">
export default {
  name: 'AttemptTimeline',
}
</script>

<style scoped lang="less">
.attempt-timeline {
  display: flex;
  flex-direction: column;
}

.attempt-item {
  display: flex;
  gap: 8px;

  &:not(:last-child) .attempt-rail::after {
    content: '';
    position: absolute;
    top: 14px;
    bottom: -4px;
    inset-inline-start: 50%;
    width: 1px;
    background: var(--color-fill-3);
  }
}

.attempt-rail {
  position: relative;
  display: flex;
  align-items: center;
  width: 12px;
  flex-shrink: 0;
}

.attempt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.dot-success {
    background: rgb(var(--green-6));
  }

  &.dot-fail {
    background: rgb(var(--red-6));
  }
}

.attempt-card {
  flex: 1;
  min-width: 0;
  padding: 8px 0;
}

.failed .attempt-card {
  .attempt-index,
  .attempt-model {
    color: var(--color-text-2);
  }
}

.attempt-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.attempt-index {
  font-size: 12px;
  color: var(--color-text-3);
}

.attempt-model {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-1);
  word-break: break-all;
}

.attempt-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.attempt-error-type {
  font-family: monospace;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 20px;
  padding: 0 8px;
  border-radius: 4px;
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

  &.default,
  &.rate-limit {
    background: var(--color-fill-2);
    color: var(--color-text-2);
  }
}

.no-response {
  font-size: 12px;
  color: var(--color-text-4);
}

.attempt-latency {
  margin-inline-start: auto;
  font-size: 12px;
  color: var(--color-text-3);
  font-variant-numeric: tabular-nums;
}
</style>

<template>
  <div class="upstream-tab">
    <div v-if="!calls?.length" class="empty">{{ t('requestDebug.noUpstream') }}</div>

    <div v-for="call in calls" :key="call.seq" class="hop">
      <div class="hop-header">
        <span class="hop-seq">#{{ call.seq }}</span>
        <a-tag size="small">{{ call.provider }}</a-tag>
        <span class="hop-model">{{ call.model || '-' }}</span>
        <a-tag v-if="call.is_retry" color="orangered" size="small">
          {{ t('requestDebug.retry') }}
        </a-tag>
        <a-tag v-if="call.is_fallback" color="purple" size="small">
          {{ t('requestDebug.fallback') }}
        </a-tag>
        <span class="hop-status" :class="statusClass(call.status_code)">
          {{ call.status_code }}
        </span>
        <span class="hop-duration">{{ formatLatency(call.duration_ms) }}</span>
        <span v-if="call.attempt > 1" class="hop-attempt">
          {{ t('requestDebug.attempt', { 0: call.attempt }) }}
        </span>
      </div>

      <div class="hop-url">{{ call.method }} {{ call.base_url }}{{ call.path }}</div>

      <div v-if="call.error" class="hop-error">
        <icon-close-circle-fill />
        {{ call.error }}
      </div>

      <a-collapse :bordered="false" class="hop-body">
        <a-collapse-item key="req" :header="t('requestDebug.reqBody')">
          <template #extra>
            <a-button
              v-if="call.req_body"
              size="mini"
              type="text"
              @click.stop="copy(call.req_body)"
            >
              <template #icon><icon-copy /></template>
            </a-button>
          </template>
          <pre v-if="call.req_body" class="content-block">{{ call.req_body }}</pre>
          <span v-else class="muted">-</span>
        </a-collapse-item>
        <a-collapse-item key="res" :header="t('requestDebug.respBody')">
          <template #extra>
            <a-button
              v-if="call.resp_body"
              size="mini"
              type="text"
              @click.stop="copy(call.resp_body)"
            >
              <template #icon><icon-copy /></template>
            </a-button>
          </template>
          <pre v-if="call.resp_body" class="content-block">{{ call.resp_body }}</pre>
          <span v-else class="muted">-</span>
        </a-collapse-item>
      </a-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatLatency, statusClass } from '@/utils/format'
import { useCopyWithFeedback } from '@/composables/use-copy-with-feedback'
import type { UpstreamCall } from '@/types'

defineProps<{ calls: UpstreamCall[] | null }>()
const { t } = useI18n()
const { copy } = useCopyWithFeedback()
</script>

<style scoped lang="less">
.upstream-tab {
  .empty {
    padding: 32px 0;
    text-align: center;
    color: var(--color-text-4);
  }

  .hop {
    padding: 12px 16px;
    background: var(--color-fill-1);
    border-radius: 6px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .hop-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .hop-seq {
      font-weight: 700;
      color: var(--color-text-1);
      font-variant-numeric: tabular-nums;
    }

    .hop-model {
      font-weight: 600;
      color: var(--color-text-1);
      font-size: 13px;
    }

    .hop-status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 20px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;

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

    .hop-duration {
      font-size: 12px;
      color: var(--color-text-3);
      font-variant-numeric: tabular-nums;
      margin-inline-start: auto;
    }

    .hop-attempt {
      font-size: 12px;
      color: var(--color-text-3);
    }
  }

  .hop-url {
    margin-top: 6px;
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text-2);
    word-break: break-all;
  }

  .hop-error {
    margin-top: 8px;
    padding: 6px 10px;
    background: var(--color-danger-light-1);
    color: rgb(var(--red-6));
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hop-body {
    margin-top: 8px;
    background: var(--color-bg-2);
  }

  .content-block {
    margin: 0;
    padding: 12px;
    background: var(--color-fill-2);
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 360px;
    overflow-y: auto;
  }

  .muted {
    color: var(--color-text-4);
  }
}
</style>

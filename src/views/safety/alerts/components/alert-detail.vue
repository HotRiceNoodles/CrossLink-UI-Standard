<template>
  <a-drawer
    :visible="visible"
    :width="560"
    :title="t('safety.alerts.detail')"
    unmount-on-close
    @cancel="emit('update:visible', false)"
  >
    <a-spin :loading="loading" style="width: 100%">
      <a-descriptions v-if="log" :column="2" bordered size="small">
        <!-- Basic info -->
        <a-descriptions-item :label="t('safety.alerts.colRule')" :span="2">
          <span style="font-weight: 600">{{ log.rule_name }}</span>
        </a-descriptions-item>
        <a-descriptions-item :label="t('safety.alerts.colEngine')">
          <a-tag color="arcoblue">{{ t(`safety.engineType.${log.engine_type}`) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('safety.alerts.colSeverity')">
          <a-tag :color="severityColor(log.severity)">
            {{ t(`safety.severity.${log.severity}`) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('safety.alerts.colAction')">
          <a-tag :color="actionColor(log.action)">{{ t(`safety.action.${log.action}`) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('safety.alerts.colDirection')">
          {{ t(`safety.direction.${log.direction}`) }}
        </a-descriptions-item>

        <!-- Reason -->
        <a-descriptions-item :label="t('safety.alerts.reason')" :span="2">
          {{ log.reason || '-' }}
        </a-descriptions-item>

        <!-- Context -->
        <a-descriptions-item :label="t('safety.alerts.colModel')">
          {{ log.model || '-' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('safety.alerts.apiKeyId')">
          {{ log.api_key_id || '-' }}
        </a-descriptions-item>

        <!-- Content preview -->
        <a-descriptions-item
          v-if="log.content_preview"
          :label="t('safety.alerts.contentPreview')"
          :span="2"
        >
          <pre class="content-preview">{{ log.content_preview }}</pre>
        </a-descriptions-item>

        <!-- Notification status -->
        <a-descriptions-item :label="t('safety.alerts.notifyStatus')" :span="2">
          <a-tag :color="statusColor(log.status)">
            {{ t(`safety.alertStatus.${log.status}`) }}
          </a-tag>
        </a-descriptions-item>

        <!-- Time -->
        <a-descriptions-item :label="t('safety.alerts.colTime')" :span="2">
          {{ formatTime(log.created_at) }}
        </a-descriptions-item>
      </a-descriptions>

      <a-empty v-else />
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatTime } from '@/utils/format'
import type { GuardrailAlertLog } from '@/types'

defineProps<{
  visible: boolean
  log: GuardrailAlertLog | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const { t } = useI18n()

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
</script>

<style scoped lang="less">
.content-preview {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}
</style>

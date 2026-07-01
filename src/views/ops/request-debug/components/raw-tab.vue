<template>
  <div class="raw-tab">
    <!-- basic info -->
    <a-descriptions :column="3" size="small" bordered class="info-desc">
      <a-descriptions-item :label="t('requestDebug.colStatus')">
        <a-tag :color="statusColor" size="small">{{ entry.resp_status }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item :label="t('requestDebug.colModel')">
        {{ model || '-' }}
      </a-descriptions-item>
      <a-descriptions-item :label="t('requestDebug.colPath')">
        {{ entry.method }} {{ entry.path }}
      </a-descriptions-item>
      <a-descriptions-item :label="t('requestDebug.colDuration')">
        {{ formatLatency(entry.duration_ms) }}
      </a-descriptions-item>
      <a-descriptions-item :label="t('requestDebug.colStream')">
        {{ entry.stream ? t('requestDebug.yes') : t('requestDebug.no') }}
      </a-descriptions-item>
      <a-descriptions-item :label="t('requestDebug.truncated')">
        <a-tag v-if="entry.truncated" color="orangered" size="small">
          {{ t('requestDebug.truncated') }}
        </a-tag>
        <span v-else>{{ t('requestDebug.no') }}</span>
      </a-descriptions-item>
    </a-descriptions>

    <!-- request -->
    <a-collapse :default-active-key="['req-body']" :bordered="false" class="block-collapse">
      <a-collapse-item key="req-headers" :header="t('requestDebug.reqHeaders')">
        <pre v-if="headerText(entry.req_headers)" class="content-block">{{
          headerText(entry.req_headers)
        }}</pre>
        <span v-else class="muted">-</span>
      </a-collapse-item>
      <a-collapse-item key="req-body" :header="t('requestDebug.reqBody')">
        <template #extra>
          <a-button
            v-if="entry.req_body"
            size="mini"
            type="text"
            @click.stop="copy(entry.req_body)"
          >
            <template #icon><icon-copy /></template>
          </a-button>
        </template>
        <pre v-if="entry.req_body" class="content-block">{{ entry.req_body }}</pre>
        <span v-else class="muted">-</span>
      </a-collapse-item>
    </a-collapse>

    <!-- response -->
    <a-collapse :default-active-key="['resp-body']" :bordered="false" class="block-collapse">
      <a-collapse-item key="resp-headers" :header="t('requestDebug.respHeaders')">
        <pre v-if="headerText(entry.resp_headers)" class="content-block">{{
          headerText(entry.resp_headers)
        }}</pre>
        <span v-else class="muted">-</span>
      </a-collapse-item>
      <a-collapse-item key="resp-body" :header="t('requestDebug.respBody')">
        <template #extra>
          <a-button
            v-if="entry.resp_body"
            size="mini"
            type="text"
            @click.stop="copy(entry.resp_body)"
          >
            <template #icon><icon-copy /></template>
          </a-button>
        </template>
        <pre v-if="entry.resp_body" class="content-block">{{ entry.resp_body }}</pre>
        <span v-else class="muted">-</span>
      </a-collapse-item>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatLatency } from '@/utils/format'
import { useCopyWithFeedback } from '@/composables/use-copy-with-feedback'
import type { DebugEntryDetail, HttpHeaders } from '@/types'

const props = defineProps<{ entry: DebugEntryDetail; model?: string }>()
const { t } = useI18n()
const { copy } = useCopyWithFeedback()

const model = computed(() => props.model)

const statusColor = computed(() => {
  const c = props.entry.resp_status
  if (c >= 200 && c < 300) return 'green'
  if (c >= 400 && c < 500) return 'orange'
  if (c >= 500) return 'red'
  return 'gray'
})

function headerText(h: HttpHeaders | undefined): string {
  if (!h) return ''
  return Object.keys(h)
    .sort()
    .map((k) => `${k}: ${h[k].join(', ')}`)
    .join('\n')
}
</script>

<style scoped lang="less">
.raw-tab {
  .info-desc {
    margin-bottom: 16px;
  }

  .block-collapse {
    margin-bottom: 16px;
    background: var(--color-fill-1);
    border-radius: 4px;
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
    max-height: 420px;
    overflow-y: auto;
  }

  .muted {
    color: var(--color-text-4);
  }
}
</style>

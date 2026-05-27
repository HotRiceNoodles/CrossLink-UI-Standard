<template>
  <div class="log-viewer">
    <a-card class="general-card">
      <template #title>{{ t('logger.title') }}</template>
      <template #extra>
        <a-space>
          <a-button size="small" @click="handleExport">{{ t('logger.export') }}</a-button>
          <a-button size="small" status="danger" @click="handleClear">{{ t('logger.clear') }}</a-button>
        </a-space>
      </template>

      <!-- Filters -->
      <a-row :gutter="12" align="center" style="margin-bottom: 12px">
        <a-col :span="8">
          <a-radio-group v-model="levelFilter" type="button" size="small">
            <a-radio value="all">{{ t('logger.all') }}</a-radio>
            <a-radio value="debug">Debug</a-radio>
            <a-radio value="info">Info</a-radio>
            <a-radio value="warn">Warn</a-radio>
            <a-radio value="error">Error</a-radio>
          </a-radio-group>
        </a-col>
        <a-col :span="4">
          <a-select v-model="sourceFilter" placeholder="来源" allow-clear size="small" style="width: 100%">
            <a-option value="vue" label="Vue" />
            <a-option value="axios" label="Axios" />
            <a-option value="router" label="Router" />
            <a-option value="app" label="App" />
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-input v-model="keyword" :placeholder="t('logger.searchPlaceholder')" allow-clear size="small" />
        </a-col>
        <a-col :span="4" style="text-align: right">
          <span style="color: var(--color-text-3); font-size: 12px">
            {{ t('logger.totalCount', [filteredLogs.length]) }}
          </span>
        </a-col>
      </a-row>

      <!-- Log List -->
      <div ref="logListRef" class="log-list">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="log-item"
          :class="[`log-${log.level}`]"
          @click="toggleExpand(log.id)"
        >
          <div class="log-header">
            <a-tag :color="levelColor(log.level)" size="small" style="width: 52px; text-align: center">
              {{ log.level.toUpperCase() }}
            </a-tag>
            <span class="log-source">{{ log.source || '-' }}</span>
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-show="expandedId === log.id" class="log-detail">
            <div v-if="getError(log.data)" class="log-section">
              <div class="log-section-title">错误堆栈</div>
              <pre class="log-stack">{{ getError(log.data)?.stack || getError(log.data)?.message }}</pre>
            </div>
            <div v-if="getCleanData(log.data)" class="log-section">
              <div class="log-section-title">数据</div>
              <pre class="log-data">{{ JSON.stringify(getCleanData(log.data), null, 2) }}</pre>
            </div>
            <div v-if="log.context" class="log-section">
              <div class="log-section-title">上下文</div>
              <pre class="log-data">{{ JSON.stringify(log.context, null, 2) }}</pre>
            </div>
          </div>
        </div>
        <div v-if="filteredLogs.length === 0" class="log-empty">{{ t('logger.empty') }}</div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { logger } from '../core'
import type { LogEntry, LogLevel } from '../types'

const { t } = useI18n()

const levelFilter = ref<string>('all')
const sourceFilter = ref<string>()
const keyword = ref('')
const expandedId = ref<number>()
const logListRef = ref<HTMLElement>()
const logs = ref<LogEntry[]>([])

let timer: ReturnType<typeof setInterval>

const filteredLogs = computed(() => {
  let list = logs.value
  if (levelFilter.value !== 'all') {
    list = list.filter((l) => l.level === levelFilter.value)
  }
  if (sourceFilter.value) {
    list = list.filter((l) => l.source === sourceFilter.value)
  }
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((l) => l.message.toLowerCase().includes(kw))
  }
  return list
})

function refreshLogs() {
  const el = logListRef.value
  const wasAtBottom = el ? el.scrollTop + el.clientHeight >= el.scrollHeight - 50 : true
  logs.value = logger.getBuffer()
  if (wasAtBottom) {
    nextTick(() => { el?.scrollTo({ top: el.scrollHeight }) })
  }
}

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? undefined : id
}

function handleClear() {
  logger.clear()
  refreshLogs()
}

function handleExport() {
  logger.export()
}

function levelColor(level: LogLevel): string {
  const map: Record<LogLevel, string> = { debug: 'gray', info: 'arcoblue', warn: 'orange', error: 'red' }
  return map[level]
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function getError(data: unknown): { name: string; message: string; stack?: string } | undefined {
  if (!data || typeof data !== 'object') return undefined
  const obj = data as Record<string, unknown>
  const err = obj.error
  if (err instanceof Error) return err
  if (err && typeof err === 'object' && 'message' in err) {
    return err as { name: string; message: string; stack?: string }
  }
  return undefined
}

function getCleanData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const obj = { ...(data as Record<string, unknown>) }
  delete obj.error
  return Object.keys(obj).length > 0 ? obj : null
}

onMounted(() => {
  refreshLogs()
  timer = setInterval(refreshLogs, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped lang="less">
.log-viewer {
  .log-list {
    max-height: calc(100vh - 280px);
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }

  .log-item {
    padding: 6px 12px;
    border-bottom: 1px solid var(--color-fill-2);
    cursor: pointer;
    font-size: 13px;
    font-family: 'Menlo', 'Consolas', monospace;

    &:hover {
      background: var(--color-fill-1);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .log-error {
    background: var(--color-danger-light-1);
  }

  .log-warn {
    background: var(--color-warning-light-1);
  }

  .log-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .log-source {
    color: var(--color-text-3);
    width: 48px;
    text-align: center;
  }

  .log-time {
    color: var(--color-text-3);
  }

  .log-message {
    color: var(--color-text-1);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .log-detail {
    margin-top: 8px;
    padding-left: 68px;
  }

  .log-section {
    margin-bottom: 8px;
  }

  .log-section-title {
    font-size: 11px;
    color: var(--color-text-3);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .log-stack {
    background: var(--color-fill-2);
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    color: rgb(var(--red-6));
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .log-data {
    background: var(--color-fill-2);
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    color: var(--color-text-2);
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .log-empty {
    padding: 40px;
    text-align: center;
    color: var(--color-text-3);
  }
}
</style>

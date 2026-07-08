<template>
  <div>
    <a-table
      :data="logs"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      size="small"
      :bordered="false"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
    >
      <template #columns>
        <a-table-column :title="t('mcp.logTime')" :width="160">
          <template #cell="{ record }">{{ formatTime(record.created_at) }}</template>
        </a-table-column>
        <a-table-column
          :title="t('mcp.logTool')"
          data-index="tool_name"
          :ellipsis="true"
          :tooltip="true"
        />
        <a-table-column :title="t('mcp.logMethod')" :width="140">
          <template #cell="{ record }">
            <span style="font-family: monospace; font-size: 12px">{{ record.method }}</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('mcp.logStatus')" :width="90" align="center">
          <template #cell="{ record }">
            <a-tag v-if="record.status === 1" color="green" size="small">
              {{ t('mcp.logStatusSuccess') }}
            </a-tag>
            <a-tag v-else-if="record.status === -1" color="red" size="small">
              {{ t('mcp.logStatusBlocked') }}
            </a-tag>
            <a-tag v-else color="orange" size="small">{{ t('mcp.logStatusError') }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column :title="t('mcp.logDuration')" :width="90" align="right">
          <template #cell="{ record }">{{ record.duration }} ms</template>
        </a-table-column>
        <a-table-column :title="t('mcp.logInput')" :width="90" align="right">
          <template #cell="{ record }">{{ formatBytes(record.input_size) }}</template>
        </a-table-column>
        <a-table-column :title="t('mcp.logOutput')" :width="90" align="right">
          <template #cell="{ record }">{{ formatBytes(record.output_size) }}</template>
        </a-table-column>
        <a-table-column :title="t('mcp.logError')" :ellipsis="true" :tooltip="true">
          <template #cell="{ record }">
            <span v-if="record.error_msg" style="color: rgb(var(--danger-6))">
              {{ record.error_msg }}
            </span>
            <span v-else style="color: var(--color-text-4)">-</span>
          </template>
        </a-table-column>
      </template>

      <template #empty>
        <a-empty :description="t('mcp.logEmpty')" />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { mcpApi } from '@/api/mcp'
import { formatTime } from '@/utils/format'
import type { McpToolCallLog } from '@/types'

const props = defineProps<{ serverId: number }>()

const { t } = useI18n()
const logs = ref<McpToolCallLog[]>([])
const loading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

async function fetchLogs() {
  loading.value = true
  try {
    const res = await mcpApi.logs(props.serverId, {
      page: pagination.current,
      page_size: pagination.pageSize,
    })
    logs.value = res.data
    pagination.total = res.pagination?.total ?? res.data.length
  } catch {
    Message.error(t('mcp.fetchFail'))
  } finally {
    loading.value = false
  }
}

function onPageChange(page: number) {
  pagination.current = page
  fetchLogs()
}

function onPageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.current = 1
  fetchLogs()
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB']
  let val = bytes
  let i = 0
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024
    i++
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

watch(
  () => props.serverId,
  () => {
    pagination.current = 1
    fetchLogs()
  },
)
onMounted(fetchLogs)
</script>

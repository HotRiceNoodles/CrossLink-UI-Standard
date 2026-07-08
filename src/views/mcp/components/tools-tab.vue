<template>
  <div>
    <a-space style="margin-bottom: 12px">
      <span style="color: var(--color-text-3); font-size: 13px">
        {{ t('mcp.toolsCount', [tools.length]) }}
      </span>
      <a-button size="small" @click="fetchTools">
        <template #icon><icon-refresh /></template>
        {{ t('common.refresh') }}
      </a-button>
    </a-space>

    <a-empty v-if="!loading && !tools.length" :description="t('mcp.toolsEmpty')" />

    <a-table
      v-else
      :data="tools"
      :loading="loading"
      :pagination="false"
      row-key="name"
      size="small"
      :bordered="false"
    >
      <template #columns>
        <a-table-column :title="t('mcp.toolName')" data-index="name" :width="220">
          <template #cell="{ record }">
            <span style="font-family: monospace; font-weight: 600">{{ record.name }}</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('mcp.toolDescription')" :ellipsis="true" :tooltip="true">
          <template #cell="{ record }">
            <span v-if="record.description">{{ record.description }}</span>
            <span v-else style="color: var(--color-text-4)">-</span>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { mcpApi } from '@/api/mcp'
import type { McpTool } from '@/types'

const props = defineProps<{ serverId: number; toolCount?: number }>()

const { t } = useI18n()
const tools = ref<McpTool[]>([])
const loading = ref(false)

async function fetchTools() {
  loading.value = true
  try {
    const res = await mcpApi.tools(props.serverId)
    // Backend returns null (not []) when tool discovery fails or yields nothing.
    tools.value = res.data ?? []
  } catch {
    Message.error(t('mcp.fetchFail'))
  } finally {
    loading.value = false
  }
}

watch(() => props.serverId, fetchTools)
onMounted(fetchTools)
</script>

<template>
  <div class="mcp-detail-page">
    <a-card class="general-card">
      <template #title>
        <a-space>
          <a-button type="text" @click="goBack">
            <template #icon><icon-left /></template>
          </a-button>
          <span>{{ server?.display_name || server?.name || t('mcp.title') }}</span>
          <a-tag v-if="server" color="arcoblue">{{ server.transport_type }}</a-tag>
        </a-space>
      </template>

      <a-tabs v-if="server" :active-key="activeTab" @change="onTabChange">
        <a-tab-pane
          v-if="userStore.hasPermission('mcp:view')"
          key="tools"
          :title="t('mcp.tabTools')"
        >
          <tools-tab :server-id="serverId" :tool-count="server.tool_count" />
        </a-tab-pane>
        <a-tab-pane
          v-if="userStore.hasPermission('mcp:permission')"
          key="permissions"
          :title="t('mcp.tabPermissions')"
        >
          <permissions-tab :server-id="serverId" />
        </a-tab-pane>
        <a-tab-pane v-if="userStore.hasPermission('mcp:logs')" key="logs" :title="t('mcp.tabLogs')">
          <logs-tab :server-id="serverId" />
        </a-tab-pane>
        <a-tab-pane
          v-if="userStore.hasPermission('mcp:stats')"
          key="stats"
          :title="t('mcp.tabStats')"
        >
          <stats-tab :server-id="serverId" />
        </a-tab-pane>
      </a-tabs>

      <a-empty v-else :description="t('common.loading')" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { mcpApi } from '@/api/mcp'
import { useUserStore } from '@/store'
import type { McpServer } from '@/types'
import ToolsTab from './components/tools-tab.vue'
import PermissionsTab from './components/permissions-tab.vue'
import LogsTab from './components/logs-tab.vue'
import StatsTab from './components/stats-tab.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const serverId = computed(() => Number(route.params.id))
const server = ref<McpServer | null>(null)
const activeTab = ref('tools')

async function fetchServer() {
  try {
    const res = await mcpApi.detail(serverId.value)
    server.value = res.data
  } catch {
    Message.error(t('mcp.fetchFail'))
  }
}

// Pick the first tab the user is allowed to see when the default isn't available.
function pickDefaultTab() {
  const order = ['tools', 'permissions', 'logs', 'stats']
  const perms: Record<string, string> = {
    tools: 'mcp:view',
    permissions: 'mcp:permission',
    logs: 'mcp:logs',
    stats: 'mcp:stats',
  }
  const first = order.find((k) => userStore.hasPermission(perms[k]))
  activeTab.value = first || 'tools'
}

function onTabChange(key: string) {
  activeTab.value = key
}

function goBack() {
  router.push({ name: 'mcpServers' })
}

onMounted(() => {
  pickDefaultTab()
  fetchServer()
})
</script>

<style scoped lang="less">
.mcp-detail-page {
  :deep(.arco-tabs-content) {
    padding-top: 12px;
  }
}
</style>

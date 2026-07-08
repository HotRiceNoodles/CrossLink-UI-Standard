<template>
  <div>
    <a-row justify="space-between" align="center" style="margin-bottom: 12px">
      <a-col>
        <span style="color: var(--color-text-3); font-size: 13px">
          {{ t('common.total', [permissions.length]) }}
        </span>
      </a-col>
      <a-col>
        <a-button
          v-if="userStore.hasPermission('mcp:permission')"
          type="primary"
          size="small"
          @click="openCreate"
        >
          <template #icon><icon-plus /></template>
          {{ t('mcp.permCreate') }}
        </a-button>
      </a-col>
    </a-row>

    <a-empty v-if="!loading && !permissions.length" :description="t('mcp.permEmpty')" />

    <a-table
      v-else
      :data="permissions"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="small"
      :bordered="false"
    >
      <template #columns>
        <a-table-column :title="t('mcp.permPrincipalType')" :width="110">
          <template #cell="{ record }">
            <a-tag color="arcoblue">{{ principalLabel(record.principal_type) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column :title="t('mcp.permPrincipal')" :width="180">
          <template #cell="{ record }">
            {{ principalDisplay(record.principal_type, record.principal_id) }}
          </template>
        </a-table-column>
        <a-table-column :title="t('mcp.permAllow')">
          <template #cell="{ record }">
            <template v-if="record.allow_tools?.length">
              <a-tag v-for="t_ in record.allow_tools" :key="t_" size="small" color="green">
                {{ t_ }}
              </a-tag>
            </template>
            <span v-else style="color: var(--color-text-4)">-</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('mcp.permDeny')">
          <template #cell="{ record }">
            <template v-if="record.deny_tools?.length">
              <a-tag v-for="t_ in record.deny_tools" :key="t_" size="small" color="red">
                {{ t_ }}
              </a-tag>
            </template>
            <span v-else style="color: var(--color-text-4)">-</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('common.actions')" :width="90" fixed="right">
          <template #cell="{ record }">
            <a-popconfirm
              :content="t('mcp.permDeleteConfirm')"
              type="warning"
              @ok="handleDelete(record)"
            >
              <a-button type="text" size="small" status="danger">
                {{ t('common.delete') }}
              </a-button>
            </a-popconfirm>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <!-- Create drawer -->
    <a-drawer
      :visible="drawerVisible"
      :width="480"
      :title="t('mcp.permCreate')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="drawerVisible = false"
      @ok="handleSubmit"
    >
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-form-item field="principal_type" :label="t('mcp.permPrincipalType')">
          <a-select v-model="form.principal_type" @change="onPrincipalTypeChange">
            <a-option value="key" :label="t('mcp.permPrincipalKey')" />
            <a-option value="team" :label="t('mcp.permPrincipalTeam')" />
            <a-option value="role" :label="t('mcp.permPrincipalRole')" />
          </a-select>
        </a-form-item>

        <a-form-item field="principal_id" :label="t('mcp.permPrincipal')">
          <a-select
            v-model="form.principal_id"
            :placeholder="t('mcp.permSelectPrincipal')"
            :loading="principalLoading"
            allow-search
          >
            <a-option v-for="o in principalOptions" :key="o.id" :value="o.id" :label="o.name" />
          </a-select>
        </a-form-item>

        <a-form-item field="allow_tools" :label="t('mcp.permAllow')">
          <a-select
            v-model="form.allow_tools"
            :placeholder="t('mcp.permAllowPlaceholder')"
            multiple
            allow-create
            allow-clear
          />
        </a-form-item>

        <a-form-item field="deny_tools" :label="t('mcp.permDeny')">
          <a-select
            v-model="form.deny_tools"
            :placeholder="t('mcp.permDenyPlaceholder')"
            multiple
            allow-create
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { mcpApi } from '@/api/mcp'
import { keyApi } from '@/api/key'
import { teamApi, roleApi } from '@/api/rbac'
import { useUserStore } from '@/store'
import type { McpServerPermission, McpPrincipalType } from '@/types'

const props = defineProps<{ serverId: number }>()

const { t } = useI18n()
const userStore = useUserStore()

const permissions = ref<McpServerPermission[]>([])
const loading = ref(false)

interface PrincipalOption {
  id: number
  name: string
}
const principalOptions = ref<PrincipalOption[]>([])
const principalLoading = ref(false)

const drawerVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const form = reactive({
  principal_type: 'key' as McpPrincipalType,
  principal_id: undefined as number | undefined,
  allow_tools: ['*'] as string[],
  deny_tools: [] as string[],
})

const rules = {
  principal_type: [{ required: true, message: t('mcp.permPrincipalType') }],
  principal_id: [{ required: true, message: t('mcp.permSelectPrincipal') }],
}

async function fetchPermissions() {
  loading.value = true
  try {
    const res = await mcpApi.listPermissions(props.serverId)
    permissions.value = res.data ?? []
  } catch {
    Message.error(t('mcp.fetchFail'))
  } finally {
    loading.value = false
  }
}

async function loadPrincipals(type: McpPrincipalType) {
  principalLoading.value = true
  try {
    let list: PrincipalOption[] = []
    if (type === 'key') {
      const res = await keyApi.list()
      list = res.data.map((k) => ({ id: k.id, name: k.name }))
    } else if (type === 'team') {
      const res = await teamApi.list()
      list = res.data.map((tm) => ({ id: tm.id, name: tm.name }))
    } else {
      const res = await roleApi.list()
      list = res.data.map((r) => ({ id: r.id, name: r.name }))
    }
    principalOptions.value = list
  } catch {
    principalOptions.value = []
  } finally {
    principalLoading.value = false
  }
}

function onPrincipalTypeChange() {
  form.principal_id = undefined
  loadPrincipals(form.principal_type)
}

function openCreate() {
  form.principal_type = 'key'
  form.principal_id = undefined
  form.allow_tools = ['*']
  form.deny_tools = []
  loadPrincipals('key')
  drawerVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await mcpApi.createPermission(props.serverId, {
      principal_type: form.principal_type,
      principal_id: form.principal_id!,
      allow_tools: form.allow_tools,
      deny_tools: form.deny_tools,
    })
    Message.success(t('common.createSuccess'))
    drawerVisible.value = false
    fetchPermissions()
  } catch {
    Message.error(t('common.operationFail'))
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(record: McpServerPermission) {
  try {
    await mcpApi.deletePermission(props.serverId, record.id)
    Message.success(t('common.deleteSuccess'))
    fetchPermissions()
  } catch {
    Message.error(t('common.deleteFail'))
  }
}

function principalLabel(type: McpPrincipalType): string {
  if (type === 'key') return t('mcp.permPrincipalKey')
  if (type === 'team') return t('mcp.permPrincipalTeam')
  return t('mcp.permPrincipalRole')
}

function principalDisplay(type: McpPrincipalType, id: number): string {
  const opt = principalOptions.value.find((o) => o.id === id)
  if (opt) return `${opt.name} (#${id})`
  return `#${id}`
}

onMounted(() => {
  fetchPermissions()
  // Preload key principals (default type) so existing rows can resolve names.
  loadPrincipals('key')
})
</script>

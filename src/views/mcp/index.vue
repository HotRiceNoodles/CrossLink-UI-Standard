<template>
  <div class="mcp-page">
    <a-card class="general-card">
      <template #title>{{ t('mcp.title') }}</template>

      <!-- Toolbar -->
      <a-row justify="space-between" align="center" style="margin-bottom: 16px">
        <a-col>
          <span style="color: var(--color-text-3); font-size: 13px">
            {{ t('mcp.totalServers', [filteredList.length]) }}
          </span>
        </a-col>
        <a-col>
          <a-space>
            <a-input
              v-model="filter.keyword"
              :placeholder="t('mcp.colName')"
              allow-clear
              style="width: 200px"
            />
            <a-button type="primary" @click="applyFilter">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilter">{{ t('common.reset') }}</a-button>
            <a-button
              v-if="userStore.hasPermission('mcp:create')"
              type="primary"
              @click="handleCreate"
            >
              <template #icon><icon-plus /></template>
              {{ t('mcp.createServer') }}
            </a-button>
            <a-tooltip :content="t('common.refresh')">
              <a-button @click="fetchData">
                <template #icon><icon-refresh /></template>
              </a-button>
            </a-tooltip>
          </a-space>
        </a-col>
      </a-row>

      <!-- Table -->
      <a-table
        :data="filteredList"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        :bordered="false"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      >
        <template #columns>
          <a-table-column :title="t('mcp.colName')" :width="200">
            <template #cell="{ record }">
              <a-space :size="6" direction="vertical" fill>
                <span style="font-weight: 600">{{ record.display_name || record.name }}</span>
                <span style="color: var(--color-text-4); font-size: 12px">{{ record.name }}</span>
              </a-space>
            </template>
          </a-table-column>

          <a-table-column :title="t('mcp.colTransport')" :width="100" align="center">
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ record.transport_type }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column :title="t('mcp.colHealth')" :width="100" align="center">
            <template #cell="{ record }">
              <a-tooltip
                v-if="record.health_status === 1"
                :content="`${t('mcp.healthHealthy')} · ${formatTime(record.last_health_check)}`"
              >
                <a-badge status="success" :text="t('mcp.healthHealthy')" />
              </a-tooltip>
              <a-badge
                v-else-if="record.health_status === -1"
                status="danger"
                :text="t('mcp.healthUnhealthy')"
              />
              <a-badge v-else status="default" :text="t('mcp.healthUnknown')" />
            </template>
          </a-table-column>

          <a-table-column
            :title="t('mcp.colToolCount')"
            data-index="tool_count"
            :width="90"
            align="right"
          />

          <a-table-column :title="t('mcp.colEnabled')" :width="90" align="center">
            <template #cell="{ record }">
              <a-switch
                :model-value="record.enabled"
                :disabled="!userStore.hasPermission('mcp:update')"
                @change="(v: string | number | boolean) => toggleEnabled(record, !!v)"
              />
            </template>
          </a-table-column>

          <a-table-column :title="t('mcp.colActions')" :width="240" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button
                  v-if="userStore.hasPermission('mcp:view')"
                  type="text"
                  size="small"
                  @click="openDetail(record)"
                >
                  {{ t('mcp.tabTools') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('mcp:update')"
                  type="text"
                  size="small"
                  :loading="testingId === record.id"
                  @click="handleTest(record)"
                >
                  {{ t('mcp.test') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('mcp:update')"
                  type="text"
                  size="small"
                  @click="openEdit(record)"
                >
                  {{ t('common.edit') }}
                </a-button>
                <a-popconfirm
                  v-if="userStore.hasPermission('mcp:delete')"
                  :content="t('mcp.deleteConfirm', { name: record.name })"
                  type="warning"
                  @ok="handleDelete(record)"
                >
                  <a-button type="text" size="small" status="danger">
                    {{ t('common.delete') }}
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- Drawer Form -->
    <a-drawer
      :visible="drawerVisible"
      :width="600"
      :title="isEdit ? t('mcp.editServer') : t('mcp.createServer')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="name" :label="t('mcp.formName')">
          <a-input
            v-model="formData.name"
            :placeholder="t('mcp.formNamePlaceholder')"
            :disabled="isEdit"
          />
        </a-form-item>

        <a-form-item field="display_name" :label="t('mcp.formDisplayName')">
          <a-input v-model="formData.display_name" :placeholder="t('mcp.formDisplayName')" />
        </a-form-item>

        <a-form-item field="description" :label="t('mcp.formDescription')">
          <a-textarea v-model="formData.description" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-item>

        <a-form-item field="transport_type" :label="t('mcp.formTransport')">
          <a-radio-group v-model="formData.transport_type">
            <a-radio value="http">http</a-radio>
            <a-radio value="sse">sse</a-radio>
            <a-radio value="stdio">stdio</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item
          v-if="formData.transport_type === 'http' || formData.transport_type === 'sse'"
          field="url"
          :label="t('mcp.formUrl')"
        >
          <a-input v-model="formData.url" :placeholder="t('mcp.formUrlPlaceholder')" />
        </a-form-item>

        <template v-if="formData.transport_type === 'stdio'">
          <a-form-item field="stdio_command" :label="t('mcp.formCommand')">
            <a-input
              v-model="formData.stdio_command"
              :placeholder="t('mcp.formCommandPlaceholder')"
            />
          </a-form-item>
          <a-form-item field="stdio_args" :label="t('mcp.formArgs')">
            <a-select
              v-model="formData.stdio_args"
              :placeholder="t('mcp.formArgsPlaceholder')"
              multiple
              allow-create
              allow-clear
              :filterable="true"
            />
          </a-form-item>
          <a-form-item field="stdio_env" :label="t('mcp.formEnv')">
            <key-value-editor v-model="formData.stdio_env" />
          </a-form-item>
        </template>

        <a-form-item field="auth_type" :label="t('mcp.formAuthType')">
          <a-select v-model="formData.auth_type">
            <a-option value="none" label="none" />
            <a-option value="bearer" label="bearer" />
            <a-option value="basic" label="basic" />
            <a-option value="oauth2" label="oauth2" />
            <a-option value="sigv4" label="sigv4" />
          </a-select>
        </a-form-item>

        <template v-if="formData.auth_type === 'bearer'">
          <a-form-item field="auth_token" :label="t('mcp.formToken')">
            <a-input-password v-model="formData.auth_token" :placeholder="secretPlaceholder" />
          </a-form-item>
        </template>

        <template v-if="formData.auth_type === 'basic'">
          <a-form-item field="auth_username" :label="t('mcp.formUsername')">
            <a-input v-model="formData.auth_username" />
          </a-form-item>
          <a-form-item field="auth_password" :label="t('mcp.formPassword')">
            <a-input-password v-model="formData.auth_password" :placeholder="secretPlaceholder" />
          </a-form-item>
        </template>

        <template v-if="formData.auth_type === 'oauth2'">
          <a-grid :cols="24" :col-gap="16">
            <a-grid-item :span="12">
              <a-form-item field="auth_client_id" :label="t('mcp.formClientId')">
                <a-input v-model="formData.auth_client_id" />
              </a-form-item>
            </a-grid-item>
            <a-grid-item :span="12">
              <a-form-item field="auth_client_secret" :label="t('mcp.formClientSecret')">
                <a-input-password
                  v-model="formData.auth_client_secret"
                  :placeholder="secretPlaceholder"
                />
              </a-form-item>
            </a-grid-item>
          </a-grid>
          <a-form-item field="auth_token_url" :label="t('mcp.formTokenUrl')">
            <a-input v-model="formData.auth_token_url" />
          </a-form-item>
          <a-form-item field="auth_scopes" :label="t('mcp.formScopes')">
            <a-input v-model="formData.auth_scopes" placeholder="scope1 scope2" />
          </a-form-item>
        </template>

        <template v-if="formData.auth_type === 'sigv4'">
          <a-grid :cols="24" :col-gap="16">
            <a-grid-item :span="12">
              <a-form-item field="auth_access_key" :label="t('mcp.formAccessKey')">
                <a-input v-model="formData.auth_access_key" />
              </a-form-item>
            </a-grid-item>
            <a-grid-item :span="12">
              <a-form-item field="auth_secret_key" :label="t('mcp.formSecretKey')">
                <a-input-password
                  v-model="formData.auth_secret_key"
                  :placeholder="secretPlaceholder"
                />
              </a-form-item>
            </a-grid-item>
          </a-grid>
          <a-grid :cols="24" :col-gap="16">
            <a-grid-item :span="12">
              <a-form-item field="auth_region" :label="t('mcp.formRegion')">
                <a-input v-model="formData.auth_region" />
              </a-form-item>
            </a-grid-item>
            <a-grid-item :span="12">
              <a-form-item field="auth_service" :label="t('mcp.formService')">
                <a-input v-model="formData.auth_service" />
              </a-form-item>
            </a-grid-item>
          </a-grid>
        </template>

        <a-form-item field="custom_headers" :label="t('mcp.formCustomHeaders')">
          <key-value-editor v-model="formData.custom_headers" />
          <template #extra>
            <span style="color: var(--color-text-3)">{{ t('mcp.formHeadersHint') }}</span>
          </template>
        </a-form-item>

        <a-form-item field="enabled" :label="t('mcp.formEnabled')">
          <a-switch v-model="formData.enabled" />
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { mcpApi } from '@/api/mcp'
import { useCrud } from '@/composables/use-crud'
import { useUserStore } from '@/store'
import { formatTime } from '@/utils/format'
import type {
  McpServer,
  McpAuthType,
  McpTransportType,
  McpServerCreateRequest,
  McpServerUpdateRequest,
} from '@/types'
import KeyValueEditor from './components/key-value-editor.vue'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const testingId = ref<number | null>(null)

// Flat form model; transformPayload assembles nested stdio_config / auth_config /
// custom_headers. Sensitive fields (auth_config, custom_headers) are sanitized to
// null by the backend on read, so they stay empty on edit ("leave empty = keep").
interface McpForm extends Partial<McpServer> {
  stdio_command?: string
  stdio_args?: string[]
  stdio_env?: Record<string, string>
  auth_token?: string
  auth_username?: string
  auth_password?: string
  auth_client_id?: string
  auth_client_secret?: string
  auth_token_url?: string
  auth_scopes?: string
  auth_access_key?: string
  auth_secret_key?: string
  auth_region?: string
  auth_service?: string
  custom_headers?: Record<string, string>
}

const {
  loading,
  filteredList,
  drawerVisible,
  isEdit,
  submitLoading,
  formRef,
  formData,
  filter,
  pagination,
  fetchData,
  applyFilter,
  resetFilter,
  handleCreate,
  handleEdit,
  handleDrawerClose,
  handleDrawerSubmit,
  handleDelete,
  onPageChange,
  onPageSizeChange,
} = useCrud<McpForm, { keyword: string }>({
  fetchApi: mcpApi.list,
  createApi: (data) =>
    mcpApi.create(assemblePayload(data, false) as unknown as McpServerCreateRequest),
  updateApi: (id, data) =>
    mcpApi.update(id, assemblePayload(data, true) as unknown as McpServerUpdateRequest),
  deleteApi: mcpApi.delete,
  idField: 'id',
  fetchErrorMsg: t('mcp.fetchFail'),
  deleteErrorMsg: t('common.deleteFail'),
  deleteSuccessMsg: t('mcp.deleteSuccess'),
  createSuccessMsg: t('common.createSuccess'),
  updateSuccessMsg: t('common.updateSuccess'),
  defaultForm: () => ({
    name: '',
    display_name: '',
    description: '',
    transport_type: 'http' as McpTransportType,
    url: '',
    stdio_command: '',
    stdio_args: [],
    stdio_env: {},
    auth_type: 'none' as McpAuthType,
    auth_token: '',
    auth_username: '',
    auth_password: '',
    auth_client_id: '',
    auth_client_secret: '',
    auth_token_url: '',
    auth_scopes: '',
    auth_access_key: '',
    auth_secret_key: '',
    auth_region: '',
    auth_service: '',
    custom_headers: {},
    enabled: true,
  }),
  filterFn: (item, f) => {
    if (!f.keyword) return true
    const kw = f.keyword.toLowerCase()
    return (
      item.name.toLowerCase().includes(kw) || (item.display_name || '').toLowerCase().includes(kw)
    )
  },
})

const formRules = {
  name: [{ required: true, message: t('mcp.nameRequired') }],
  transport_type: [{ required: true, message: t('mcp.transportRequired') }],
}

const secretPlaceholder = t('mcp.formSecretHint')

// Assemble the flat form model into the backend's nested shape.
// On edit, sensitive sections are only sent when the user filled them in,
// so the backend keeps the existing encrypted values otherwise.
function assemblePayload(raw: Partial<McpForm>, edit: boolean): Record<string, unknown> {
  const p: Record<string, unknown> = {
    name: raw.name,
    display_name: raw.display_name,
    description: raw.description,
    transport_type: raw.transport_type,
    auth_type: raw.auth_type,
    enabled: raw.enabled,
  }

  if (raw.transport_type === 'http' || raw.transport_type === 'sse') {
    p.url = raw.url
  } else if (raw.transport_type === 'stdio') {
    const stdio: Record<string, unknown> = { command: raw.stdio_command || '' }
    if (raw.stdio_args?.length) stdio.args = raw.stdio_args
    if (raw.stdio_env && Object.keys(raw.stdio_env).length) stdio.env = raw.stdio_env
    p.stdio_config = stdio
  }

  const auth = buildAuthConfig(raw)
  if (auth) p.auth_config = auth

  if (raw.custom_headers && Object.keys(raw.custom_headers).length) {
    p.custom_headers = raw.custom_headers
  } else if (!edit) {
    p.custom_headers = {}
  }

  return p
}

function buildAuthConfig(raw: Partial<McpForm>): Record<string, unknown> | undefined {
  switch (raw.auth_type) {
    case 'bearer':
      return raw.auth_token ? { token: raw.auth_token } : undefined
    case 'basic': {
      if (!raw.auth_username && !raw.auth_password) return undefined
      return { username: raw.auth_username || '', password: raw.auth_password || '' }
    }
    case 'oauth2': {
      if (!raw.auth_client_id && !raw.auth_client_secret && !raw.auth_token_url) return undefined
      return {
        client_id: raw.auth_client_id || '',
        client_secret: raw.auth_client_secret || '',
        token_url: raw.auth_token_url || '',
        scopes: raw.auth_scopes || '',
      }
    }
    case 'sigv4': {
      if (!raw.auth_access_key && !raw.auth_secret_key) return undefined
      return {
        access_key: raw.auth_access_key || '',
        secret_key: raw.auth_secret_key || '',
        region: raw.auth_region || '',
        service: raw.auth_service || '',
      }
    }
    default:
      return undefined
  }
}

function openEdit(record: McpServer) {
  handleEdit(record)
  // Pre-fill stdio fields from the returned stdio_config (not sanitized).
  const stdio = record.stdio_config
  ;(formData as McpForm).stdio_command = stdio?.command || ''
  ;(formData as McpForm).stdio_args = stdio?.args ? [...stdio.args] : []
  ;(formData as McpForm).stdio_env = stdio?.env ? { ...stdio.env } : {}
  // auth_config / custom_headers are sanitized to null on read — left empty on purpose.
  ;(formData as McpForm).custom_headers = {}
}

async function toggleEnabled(record: McpServer, enabled: boolean) {
  try {
    await mcpApi.update(record.id, { enabled })
    record.enabled = enabled
    Message.success(t('common.updateSuccess'))
  } catch {
    Message.error(t('common.operationFail'))
  }
}

async function handleTest(record: McpServer) {
  testingId.value = record.id
  try {
    const res = await mcpApi.test(record.id)
    if (res.data.healthy) Message.success(t('mcp.testSuccess'))
    else Message.error(t('mcp.testFail', { 0: res.data.error || 'unhealthy' }))
    await fetchData()
  } catch (err) {
    const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
    Message.error(t('mcp.testFail', { 0: msg || 'unknown' }))
  } finally {
    testingId.value = null
  }
}

function openDetail(record: McpServer) {
  router.push({ name: 'mcpDetail', params: { id: record.id } })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.mcp-page {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
</style>

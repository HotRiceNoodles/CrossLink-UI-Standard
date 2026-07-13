<template>
  <div class="org-page">
    <a-card class="general-card">
      <template #title>{{ t('auth.organizations.title') }}</template>
      <template #extra>
        <a-space>
          <a-input-search
            v-model="filter.keyword"
            :placeholder="t('common.search')"
            allow-clear
            style="width: 200px"
            @search="applyFilter"
            @clear="resetFilter"
          />
          <a-button
            v-if="userStore.hasPermission('org:create')"
            type="primary"
            @click="handleCreate"
          >
            <template #icon><icon-plus /></template>
            {{ t('auth.organizations.createOrg') }}
          </a-button>
          <a-tooltip :content="t('common.refresh')">
            <a-button @click="loadData">
              <template #icon><icon-refresh /></template>
            </a-button>
          </a-tooltip>
          <a-radio-group v-model="viewMode" type="button" size="small">
            <a-radio value="card"><icon-apps /></a-radio>
            <a-radio value="table"><icon-list /></a-radio>
          </a-radio-group>
        </a-space>
      </template>

      <!-- Count -->
      <a-row justify="end" align="center">
        <a-col>
          <span style="color: var(--color-text-3); font-size: 13px">
            {{ t('common.total', [filteredList.length]) }}
          </span>
        </a-col>
      </a-row>

      <!-- Table View -->
      <a-table
        v-if="viewMode === 'table'"
        :data="filteredList"
        :loading="loading"
        :pagination="tablePagination"
        row-key="id"
        size="small"
        :bordered="false"
        style="margin-top: 16px"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      >
        <template #columns>
          <a-table-column :title="t('auth.organizations.tableName')" data-index="name" :width="140">
            <template #cell="{ record }">
              <div style="display: flex; align-items: center; gap: 8px">
                <a-avatar :size="28" :style="{ backgroundColor: avatarColor(record) }">
                  {{ record.display_name?.charAt(0)?.toUpperCase() || '?' }}
                </a-avatar>
                <span
                  style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px"
                >
                  {{ record.name }}
                </span>
              </div>
            </template>
          </a-table-column>
          <a-table-column
            :title="t('auth.organizations.tableDisplayName')"
            data-index="display_name"
            :ellipsis="true"
          />
          <a-table-column :title="t('common.status')" :width="80" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
                {{ record.status === 1 ? t('common.active') : t('common.disabled') }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column :title="t('auth.organizations.cardMembers')" :width="70" align="center">
            <template #cell="{ record }">{{ record.member_count ?? '--' }}</template>
          </a-table-column>
          <a-table-column :title="t('auth.organizations.cardTeams')" :width="70" align="center">
            <template #cell="{ record }">{{ record.team_count ?? '--' }}</template>
          </a-table-column>
          <a-table-column :title="t('auth.organizations.cardKeys')" :width="70" align="center">
            <template #cell="{ record }">{{ record.key_count ?? '--' }}</template>
          </a-table-column>
          <a-table-column :title="t('auth.organizations.budgetUsage')" :width="160">
            <template #cell="{ record }">
              <a-progress
                v-if="budgetMap[record.id]"
                :percent="budgetMap[record.id].usage_pct / 100"
                :color="progressColor(budgetMap[record.id])"
                size="small"
              />
              <span v-else style="color: var(--color-text-4)">--</span>
            </template>
          </a-table-column>
          <a-table-column :title="t('common.actions')" :width="180" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button
                  v-if="userStore.hasPermission('org:update')"
                  type="text"
                  size="small"
                  @click="handleEdit(record)"
                >
                  {{ t('common.edit') }}
                </a-button>
                <a-button type="text" size="small" @click="openDetailDrawer(record)">
                  {{ t('auth.organizations.detail') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('org:delete')"
                  type="text"
                  size="small"
                  status="danger"
                  @click="handleDeleteOrg(record)"
                >
                  {{ t('common.delete') }}
                </a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>

      <!-- Card View -->
      <a-spin v-else :loading="loading" style="width: 100%; min-height: 200px">
        <a-row :gutter="16" style="margin-top: 16px">
          <a-col v-for="org in paginatedList" :key="org.id" :span="8" style="margin-bottom: 16px">
            <org-card
              :org="org"
              :budget="budgetMap[org.id] ?? null"
              @edit="handleEdit"
              @detail="openDetailDrawer"
              @delete="handleDeleteOrg"
              @enter="handleEnterOrg"
            />
          </a-col>
        </a-row>
        <a-empty v-if="!loading && filteredList.length === 0" style="padding: 48px 0" />
      </a-spin>

      <!-- Pagination (card view only — table has its own) -->
      <div
        v-if="viewMode === 'card' && filteredList.length > cardPageSize"
        style="margin-top: 16px; text-align: end"
      >
        <a-pagination
          v-model:current="cardCurrent"
          :total="filteredList.length"
          :page-size="cardPageSize"
          show-total
          show-page-size
          @page-size-change="handleCardPageSizeChange"
        />
      </div>
    </a-card>

    <!-- Create / Edit Drawer -->
    <a-drawer
      :visible="drawerVisible"
      :width="560"
      :title="isEdit ? t('auth.organizations.editOrg') : t('auth.organizations.createOrg')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="name" :label="t('auth.organizations.tableName')">
          <a-input v-model="formData.name" :placeholder="t('auth.organizations.namePlaceholder')" />
        </a-form-item>

        <a-form-item field="display_name" :label="t('auth.organizations.tableDisplayName')">
          <a-input
            v-model="formData.display_name"
            :placeholder="t('auth.organizations.displayNamePlaceholder')"
          />
        </a-form-item>

        <a-form-item field="description" :label="t('auth.teams.tableDescription')">
          <a-textarea
            v-model="formData.description"
            :placeholder="t('auth.organizations.descriptionPlaceholder')"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="budget_limit" :label="t('key.budgetLimitLabel')">
              <a-input-number
                v-model="formData.budget_limit"
                :min="0"
                :precision="2"
                :placeholder="t('key.budgetPlaceholder')"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="budget_period" :label="t('key.budgetPeriodLabel')">
              <a-select
                v-model="formData.budget_period"
                :placeholder="t('key.budgetPeriodPlaceholder')"
              >
                <a-option value="daily" :label="t('key.periodDaily')" />
                <a-option value="weekly" :label="t('key.periodWeekly')" />
                <a-option value="monthly" :label="t('key.periodMonthly')" />
              </a-select>
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="tpm_limit" :label="t('key.tpmLimitLabel')">
              <a-input-number
                v-model="formData.tpm_limit"
                :min="0"
                :placeholder="t('key.limitPlaceholder')"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="rpm_limit" :label="t('key.rpmLimitLabel')">
              <a-input-number
                v-model="formData.rpm_limit"
                :min="0"
                :placeholder="t('key.limitPlaceholder')"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-form-item v-if="!isEdit" field="admin_email" label="Admin Email">
          <a-input
            v-model="formData.admin_email"
            :placeholder="t('auth.organizations.adminEmailPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- Detail Drawer (Members + Budget tabs) -->
    <a-drawer
      :visible="detailDrawerVisible"
      :width="720"
      :title="t('auth.organizations.detail')"
      :mask-closable="false"
      unmount-on-close
      :footer="false"
      @cancel="detailDrawerVisible = false"
    >
      <a-tabs default-active-key="members">
        <a-tab-pane key="members" :title="t('auth.organizations.tabMembers')">
          <org-member-drawer :org-id="detailOrgId" />
        </a-tab-pane>
        <a-tab-pane key="budget" :title="t('auth.organizations.tabBudget')">
          <budget-panel :org-id="detailOrgId" />
        </a-tab-pane>
      </a-tabs>
    </a-drawer>

    <!-- Credentials Modal -->
    <a-modal
      v-model:visible="credentialsVisible"
      :title="t('auth.organizations.credentialsTitle')"
      :mask-closable="false"
      :closable="false"
      :footer="false"
      :width="520"
    >
      <a-alert
        v-if="credentials.email && !credentialsEmailSent"
        type="error"
        :closable="false"
        style="margin-bottom: 16px"
      >
        {{ t('auth.organizations.credentialsEmailFailed', { email: credentials.email }) }}
      </a-alert>
      <a-alert v-else type="warning" :closable="false" style="margin-bottom: 16px">
        {{ t('auth.organizations.credentialsWarning') }}
      </a-alert>
      <a-form :model="{}" layout="vertical">
        <a-form-item :label="t('auth.organizations.username')">
          <a-input :model-value="credentials.username" readonly>
            <template #append>
              <a-button type="text" @click="handleCopyCredential('username')">
                <template #icon><icon-copy /></template>
              </a-button>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item :label="t('auth.organizations.password')">
          <a-input-password :model-value="credentials.password" readonly>
            <template #append>
              <a-button type="text" @click="handleCopyCredential('password')">
                <template #icon><icon-copy /></template>
              </a-button>
            </template>
          </a-input-password>
        </a-form-item>
      </a-form>
      <div style="margin-top: 16px; text-align: end">
        <a-space>
          <a-button @click="handleCopyAll">
            <template #icon><icon-copy /></template>
            {{ t('auth.organizations.copyAll') }}
          </a-button>
          <a-button type="primary" @click="credentialsVisible = false">
            {{ t('common.confirm') }}
          </a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { orgApi } from '@/api/rbac'
import { copyToClipboard } from '@/utils/clipboard'
import { useCrud } from '@/composables/use-crud'
import type { Organization, OrgBudget } from '@/types'
import type { AdminCredentials } from '@/types/auth-module'
import OrgCard from './components/org-card.vue'
import OrgMemberDrawer from './components/member-drawer.vue'
import BudgetPanel from './components/budget-panel.vue'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

// View mode toggle
const viewMode = ref<'card' | 'table'>('card')

// Detail drawer
const detailDrawerVisible = ref(false)
const detailOrgId = ref(0)

// Credentials modal
const credentialsVisible = ref(false)
const credentialsEmailSent = ref(false)
const credentials = reactive({ username: '', password: '', email: '' })

async function handleCopyCredential(field: 'username' | 'password') {
  try {
    await copyToClipboard(credentials[field])
    Message.success(t('common.copied'))
  } catch {
    Message.error(t('common.copyFail'))
  }
}

async function handleCopyAll() {
  const text = `${t('auth.organizations.username')}: ${credentials.username}\n${t('auth.organizations.password')}: ${credentials.password}`
  try {
    await copyToClipboard(text)
    Message.success(t('auth.organizations.copyAllSuccess'))
  } catch {
    Message.error(t('common.copyFail'))
  }
}

// Budget data map
const budgetMap = ref<Record<number, OrgBudget>>({})

// Table pagination (for table view, using useCrud's pagination)
// Card pagination (separate, for card view)
const cardCurrent = ref(1)
const cardPageSize = ref(12)

// Shared helpers
const COLORS = [
  '#165DFF',
  '#00B42A',
  '#FF7D00',
  '#722ED1',
  '#0FC6C2',
  '#F77234',
  '#3491FA',
  '#9FDB1D',
]

function avatarColor(org: { display_name?: string; name: string }) {
  let hash = 0
  const name = org.display_name || org.name
  for (const ch of name) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function progressColor(budget: OrgBudget) {
  if (budget.usage_pct >= 90) return 'red'
  if (budget.usage_pct >= 70) return 'orangered'
  return 'arcoblue'
}

// useCrud with enriched fetchApi
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
  hideDrawer,
  onPageChange,
  onPageSizeChange,
} = useCrud<Organization, { keyword: string }>({
  fetchApi: async () => {
    const res = await orgApi.list()
    // Enrich with detail data (member_count, team_count, key_count)
    const enriched = await Promise.all(
      res.data.map((org) =>
        orgApi
          .detail(org.id)
          .then((r) => ({ ...org, ...r.data }))
          .catch(() => org),
      ),
    )
    return { data: enriched }
  },
  createApi: orgApi.create,
  updateApi: orgApi.update,
  idField: 'id',
  fetchErrorMsg: t('auth.organizations.fetchFail'),
  defaultForm: () => ({
    name: '',
    display_name: '',
    description: '',
    budget_limit: null,
    budget_period: 'monthly',
    rpm_limit: 0,
    tpm_limit: 0,
    admin_email: '',
  }),
  filterFn: (item, f) => {
    if (!f.keyword) return true
    const kw = f.keyword.toLowerCase()
    return item.name.toLowerCase().includes(kw) || item.display_name.toLowerCase().includes(kw)
  },
  immediateFilter: true,
  onCreated: async (_responseData, fullResponse) => {
    Message.success(t('common.createSuccess'))
    hideDrawer()

    const creds = (fullResponse as { admin_credentials?: AdminCredentials })?.admin_credentials
    if (!creds) return

    // Scenario B: email was provided and sent successfully
    if (creds.email_sent && creds.email) {
      Message.success(t('auth.organizations.credentialsEmailSent', { email: creds.email }))
      return
    }

    // Scenarios A & C: show credentials modal
    credentials.username = creds.username
    credentials.password = creds.password
    credentials.email = creds.email
    credentialsEmailSent.value = creds.email_sent
    credentialsVisible.value = true
  },
})

const formRules = {
  name: [{ required: true, message: t('auth.organizations.nameRequired') }],
  display_name: [{ required: true, message: t('auth.organizations.displayNameRequired') }],
}

// Table pagination computed (wraps useCrud pagination for a-table format)
const tablePagination = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: filteredList.value.length,
  showTotal: true,
  showPageSize: true,
}))

// Card view paginated list
const paginatedList = computed(() => {
  const start = (cardCurrent.value - 1) * cardPageSize.value
  return filteredList.value.slice(start, start + cardPageSize.value)
})

function handleCardPageSizeChange(newSize: number) {
  cardPageSize.value = newSize
  cardCurrent.value = 1
}

// Fetch budget data for all orgs in parallel
async function fetchAllBudgets() {
  const orgs = filteredList.value
  if (!orgs.length) return
  const results = await Promise.allSettled(orgs.map((org) => orgApi.budget(org.id)))
  const map: Record<number, OrgBudget> = {}
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      map[orgs[i].id] = r.value.data
    }
  })
  budgetMap.value = map
}

// Combined data loading: fetch orgs (enriched) + budgets
async function loadData() {
  await fetchData()
  await fetchAllBudgets()
}

function handleDeleteOrg(record: Organization) {
  Modal.confirm({
    title: t('common.confirm'),
    content: t('auth.organizations.confirmDelete', {
      name: record.display_name || record.name,
    }),
    onOk: async () => {
      try {
        await orgApi.delete(record.id)
        Message.success(t('auth.organizations.deleteSuccess'))
        await loadData()
      } catch {
        Message.error(t('common.deleteFail'))
      }
    },
  })
}

function openDetailDrawer(record: Organization) {
  detailOrgId.value = record.id
  detailDrawerVisible.value = true
}

const entering = ref<number | null>(null)

async function handleEnterOrg(org: Organization) {
  if (entering.value) return
  entering.value = org.id
  try {
    await userStore.switchOrg(org.id)
    router.push(`/org/${org.id}/dashboard`)
  } catch {
    Message.error(t('org.switcher.switchFailed'))
  } finally {
    entering.value = null
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="less">
.org-page {
  :deep(.arco-pagination) {
    margin-top: 8px;
  }
}
</style>

<template>
  <div class="org-page">
    <a-card class="general-card">
      <template #title>{{ t('auth.organizations.title') }}</template>

      <!-- Search -->
      <a-row :gutter="16" align="center">
        <a-col :span="6">
          <a-input v-model="filter.keyword" :placeholder="t('common.search')" allow-clear />
        </a-col>
        <a-col :span="6">
          <a-space>
            <a-button type="primary" @click="applyFilter">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilter">{{ t('common.reset') }}</a-button>
          </a-space>
        </a-col>
      </a-row>

      <a-divider style="margin: 16px 0" />

      <!-- Toolbar -->
      <a-row justify="space-between" align="center" style="margin-bottom: 16px">
        <a-col>
          <span style="color: var(--color-text-3); font-size: 13px">
            {{ t('common.total', [filteredList.length]) }}
          </span>
        </a-col>
        <a-col>
          <a-space>
            <a-button
              v-if="userStore.hasPermission('org:create')"
              type="primary"
              @click="handleCreate"
            >
              <template #icon><icon-plus /></template>
              {{ t('auth.organizations.createOrg') }}
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
          <a-table-column :title="t('auth.organizations.tableName')" data-index="name" :width="140">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.name }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('auth.organizations.tableDisplayName')"
            data-index="display_name"
            :width="160"
          />

          <a-table-column :title="t('auth.organizations.tableBudget')" :width="120" align="right">
            <template #cell="{ record }">
              <template v-if="record.budget_limit">
                ¥{{ record.budget_limit }} / {{ budgetPeriodLabel(record.budget_period) }}
              </template>
              <span v-else style="color: var(--color-text-3)">{{ t('common.unlimited') }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('auth.organizations.tableRateLimit')"
            :width="140"
            align="center"
          >
            <template #cell="{ record }">
              <span>TPM: {{ record.tpm_limit || t('common.unlimited') }}</span>
              <br />
              <span>RPM: {{ record.rpm_limit || t('common.unlimited') }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('common.actions')" :width="200" fixed="right">
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
                <a-button
                  v-if="userStore.hasPermission('org:manage_members')"
                  type="text"
                  size="small"
                  @click="openDetailDrawer(record)"
                >
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
      <a-alert type="warning" :closable="false" style="margin-bottom: 16px">
        {{ t('auth.organizations.credentialsWarning') }}
      </a-alert>
      <a-form :model="{}" layout="vertical">
        <a-form-item :label="t('auth.organizations.username')">
          <a-input :model-value="credentials.username" readonly />
        </a-form-item>
        <a-form-item :label="t('auth.organizations.password')">
          <a-input-password :model-value="credentials.password" readonly />
        </a-form-item>
      </a-form>
      <div style="margin-top: 16px; text-align: right">
        <a-button type="primary" @click="credentialsVisible = false">
          {{ t('common.confirm') }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { orgApi } from '@/api/rbac'
import { useCrud } from '@/composables/use-crud'
import type { Organization } from '@/types'
import OrgMemberDrawer from './components/member-drawer.vue'
import BudgetPanel from './components/budget-panel.vue'

const { t } = useI18n()
const userStore = useUserStore()

// Detail drawer
const detailDrawerVisible = ref(false)
const detailOrgId = ref(0)

// Credentials modal
const credentialsVisible = ref(false)
const credentials = reactive({ username: '', password: '' })

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
} = useCrud<Organization, { keyword: string }>({
  fetchApi: orgApi.list,
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
  onCreated: async (responseData) => {
    const data = responseData as { admin_credentials?: { username: string; password: string } }
    if (data.admin_credentials) {
      credentials.username = data.admin_credentials.username
      credentials.password = data.admin_credentials.password
      credentialsVisible.value = true
    }
  },
})

const formRules = {
  name: [{ required: true, message: t('auth.organizations.nameRequired') }],
  display_name: [{ required: true, message: t('auth.organizations.displayNameRequired') }],
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
        await fetchData()
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

function budgetPeriodLabel(period: string) {
  const map: Record<string, string> = {
    daily: t('key.periodDay'),
    weekly: t('key.periodWeek'),
    monthly: t('key.periodMonth'),
  }
  return map[period] || period
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.org-page {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
</style>

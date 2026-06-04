<template>
  <div class="team-page">
    <a-card class="general-card">
      <template #title>{{ t('auth.teams.title') }}</template>

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
              v-if="userStore.hasPermission('team:create')"
              type="primary"
              @click="handleCreate"
            >
              <template #icon><icon-plus /></template>
              {{ t('auth.teams.createTeam') }}
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
          <a-table-column :title="t('auth.teams.tableName')" data-index="name" :width="140">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.name }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('auth.teams.tableDisplayName')"
            data-index="display_name"
            :width="160"
          />

          <a-table-column
            :title="t('auth.teams.tableDescription')"
            data-index="description"
            :width="200"
            :ellipsis="true"
            :tooltip="true"
          />

          <a-table-column
            :title="t('auth.teams.tableStatus')"
            data-index="status"
            :width="80"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? t('common.enabled') : t('common.disabled') }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column :title="t('auth.teams.tableBudget')" :width="120" align="right">
            <template #cell="{ record }">
              <template v-if="record.budget_limit">
                ¥{{ record.budget_limit }} / {{ budgetPeriodLabel(record.budget_period) }}
              </template>
              <span v-else style="color: var(--color-text-3)">{{ t('common.unlimited') }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('auth.teams.tableRateLimit')" :width="140" align="center">
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
                  v-if="userStore.hasPermission('team:update')"
                  type="text"
                  size="small"
                  @click="handleEdit(record)"
                >
                  {{ t('common.edit') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('team:manage_members')"
                  type="text"
                  size="small"
                  @click="openMemberDrawer(record)"
                >
                  {{ t('auth.teams.members') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('team:delete')"
                  type="text"
                  size="small"
                  status="danger"
                  @click="handleDeleteTeam(record)"
                >
                  {{ t('common.delete') }}
                </a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- Drawer Form -->
    <a-drawer
      :visible="drawerVisible"
      :width="560"
      :title="isEdit ? t('auth.teams.editTeam') : t('auth.teams.createTeam')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="name" :label="t('auth.teams.tableName')">
          <a-input v-model="formData.name" :placeholder="t('auth.teams.namePlaceholder')" />
        </a-form-item>

        <a-form-item field="display_name" :label="t('auth.teams.tableDisplayName')">
          <a-input
            v-model="formData.display_name"
            :placeholder="t('auth.teams.displayNamePlaceholder')"
          />
        </a-form-item>

        <a-form-item field="description" :label="t('auth.teams.tableDescription')">
          <a-textarea
            v-model="formData.description"
            :placeholder="t('auth.teams.descriptionPlaceholder')"
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

        <a-form-item v-if="isEdit" field="status" :label="t('common.status')">
          <a-select v-model="formData.status">
            <a-option :value="1" :label="t('common.enabled')" />
            <a-option :value="0" :label="t('common.disabled')" />
          </a-select>
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- Member Drawer -->
    <member-drawer v-model:visible="memberDrawerVisible" :team-id="memberDrawerTeamId" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { teamApi } from '@/api/rbac'
import { useCrud } from '@/composables/use-crud'
import type { Team } from '@/types'
import MemberDrawer from './components/member-drawer.vue'

const { t } = useI18n()
const userStore = useUserStore()

// Member drawer
const memberDrawerVisible = ref(false)
const memberDrawerTeamId = ref(0)

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
} = useCrud<Team, { keyword: string }>({
  fetchApi: teamApi.list,
  createApi: teamApi.create,
  updateApi: teamApi.update,
  idField: 'id',
  fetchErrorMsg: t('auth.teams.fetchFail'),
  defaultForm: () => ({
    name: '',
    display_name: '',
    description: '',
    budget_limit: null,
    budget_period: 'monthly',
    rpm_limit: 0,
    tpm_limit: 0,
    status: 1,
  }),
  filterFn: (item, f) => {
    if (!f.keyword) return true
    const kw = f.keyword.toLowerCase()
    return item.name.toLowerCase().includes(kw) || item.display_name.toLowerCase().includes(kw)
  },
  immediateFilter: true,
})

const formRules = {
  name: [{ required: true, message: t('auth.teams.nameRequired') }],
  display_name: [{ required: true, message: t('auth.teams.displayNameRequired') }],
}

function handleDeleteTeam(record: Team) {
  Modal.confirm({
    title: t('common.confirm'),
    content: t('auth.teams.confirmDelete', { name: record.display_name || record.name }),
    onOk: async () => {
      try {
        await teamApi.delete(record.id)
        Message.success(t('auth.teams.deleteSuccess'))
        await fetchData()
      } catch {
        Message.error(t('common.deleteFail'))
      }
    },
  })
}

function openMemberDrawer(record: Team) {
  memberDrawerTeamId.value = record.id
  memberDrawerVisible.value = true
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
.team-page {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
</style>

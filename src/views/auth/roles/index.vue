<template>
  <div class="role-page">
    <a-card class="general-card">
      <template #title>{{ t('auth.roles.title') }}</template>

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
              v-if="userStore.hasPermission('role:create')"
              type="primary"
              @click="handleCreate"
            >
              <template #icon><icon-plus /></template>
              {{ t('auth.roles.createRole') }}
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
          <a-table-column :title="t('auth.roles.tableName')" data-index="name" :width="140">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.name }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('auth.roles.tableDisplayName')"
            data-index="display_name"
            :width="160"
          />

          <a-table-column
            :title="t('auth.roles.tableUserCount')"
            data-index="user_count"
            :width="100"
            align="center"
          />

          <a-table-column :title="t('auth.roles.tablePermissionCount')" :width="120" align="center">
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ record.permissions?.length || 0 }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column :title="t('common.actions')" :width="160" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button
                  v-if="userStore.hasPermission('role:update')"
                  type="text"
                  size="small"
                  @click="handleEdit(record)"
                >
                  {{ t('common.edit') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('role:delete') && !record.is_system"
                  type="text"
                  size="small"
                  status="danger"
                  @click="handleDeleteRole(record)"
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
      :width="680"
      :title="isEdit ? t('auth.roles.editRole') : t('auth.roles.createRole')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="name" :label="t('auth.roles.tableName')">
          <a-input
            v-model="formData.name"
            :placeholder="t('auth.roles.namePlaceholder')"
            :disabled="isEdit"
          />
        </a-form-item>

        <a-form-item field="display_name" :label="t('auth.roles.tableDisplayName')">
          <a-input
            v-model="formData.display_name"
            :placeholder="t('auth.roles.displayNamePlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="t('auth.roles.tablePermissionCount')">
          <permission-editor v-model="formData.permissions" />
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { roleApi } from '@/api/rbac'
import { useCrud } from '@/composables/use-crud'
import type { Role } from '@/types'
import PermissionEditor from './components/permission-editor.vue'

const { t } = useI18n()
const userStore = useUserStore()

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
} = useCrud<Role, { keyword: string }>({
  fetchApi: roleApi.list,
  createApi: roleApi.create,
  updateApi: roleApi.update,
  idField: 'id',
  fetchErrorMsg: t('auth.roles.fetchFail'),
  defaultForm: () => ({
    name: '',
    display_name: '',
    permissions: [],
  }),
  filterFn: (item, f) => {
    if (!f.keyword) return true
    const kw = f.keyword.toLowerCase()
    return item.name.toLowerCase().includes(kw) || item.display_name.toLowerCase().includes(kw)
  },
  immediateFilter: true,
  transformPayload: (formData, isEdit) => {
    if (isEdit) {
      return {
        display_name: formData.display_name,
        permissions: formData.permissions,
      }
    }
    return {
      name: formData.name,
      display_name: formData.display_name,
      permissions: formData.permissions,
    }
  },
})

const formRules = {
  name: [{ required: true, message: t('auth.roles.nameRequired') }],
  display_name: [{ required: true, message: t('auth.roles.displayNameRequired') }],
}

function handleDeleteRole(record: Role) {
  if (record.user_count > 0) {
    Modal.warning({
      title: t('auth.roles.cannotDelete'),
      content: t('auth.roles.cannotDeleteContent', [record.user_count]),
    })
    return
  }
  Modal.confirm({
    title: t('common.confirm'),
    content: t('auth.roles.confirmDelete', { name: record.display_name || record.name }),
    onOk: async () => {
      try {
        await roleApi.delete(record.id)
        Message.success(t('auth.roles.deleteSuccess'))
        await fetchData()
      } catch {
        Message.error(t('common.deleteFail'))
      }
    },
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.role-page {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
</style>

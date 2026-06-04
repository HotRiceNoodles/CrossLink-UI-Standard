<template>
  <div class="user-page">
    <a-card class="general-card">
      <template #title>{{ t('auth.users.title') }}</template>

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
              v-if="userStore.hasPermission('user:create')"
              type="primary"
              @click="handleCreate"
            >
              <template #icon><icon-plus /></template>
              {{ t('auth.users.createUser') }}
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
          <a-table-column :title="t('auth.users.tableUsername')" data-index="username" :width="140">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.username }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('auth.users.tableDisplayName')"
            data-index="display_name"
            :width="140"
          />

          <a-table-column :title="t('auth.users.tableRole')" :width="120" align="center">
            <template #cell="{ record }">
              <a-tag v-if="record.role" color="arcoblue">{{ record.role.display_name }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('auth.users.tableStatus')"
            data-index="status"
            :width="100"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? t('common.enabled') : t('common.disabled') }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('auth.users.tableCreatedAt')"
            data-index="created_at"
            :width="160"
          >
            <template #cell="{ record }">
              {{ formatTime(record.created_at) }}
            </template>
          </a-table-column>

          <a-table-column :title="t('common.actions')" :width="220" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button
                  v-if="userStore.hasPermission('user:update')"
                  type="text"
                  size="small"
                  @click="handleEdit(record)"
                >
                  {{ t('common.edit') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('user:update')"
                  type="text"
                  size="small"
                  @click="openResetPassword(record)"
                >
                  {{ t('auth.users.resetPassword') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('user:delete')"
                  type="text"
                  size="small"
                  status="danger"
                  @click="handleDeleteUser(record)"
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
      :title="isEdit ? t('auth.users.editUser') : t('auth.users.createUser')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="username" :label="t('auth.users.tableUsername')">
          <a-input
            v-model="formData.username"
            :placeholder="t('auth.users.usernamePlaceholder')"
            :disabled="isEdit"
          />
        </a-form-item>

        <a-form-item v-if="!isEdit" field="password" :label="t('login.password')">
          <a-input-password
            v-model="formData.password"
            :placeholder="t('auth.users.passwordPlaceholder')"
          />
        </a-form-item>

        <a-form-item field="display_name" :label="t('auth.users.tableDisplayName')">
          <a-input
            v-model="formData.display_name"
            :placeholder="t('auth.users.displayNamePlaceholder')"
          />
        </a-form-item>

        <a-form-item field="role_id" :label="t('auth.users.tableRole')">
          <a-select v-model="formData.role_id" :placeholder="t('auth.users.roleRequired')">
            <a-option
              v-for="role in roles"
              :key="role.id"
              :value="role.id"
              :label="role.display_name || role.name"
            />
          </a-select>
        </a-form-item>

        <a-form-item v-if="isEdit" field="status" :label="t('common.status')">
          <a-select v-model="formData.status">
            <a-option :value="1" :label="t('common.enabled')" />
            <a-option :value="0" :label="t('common.disabled')" />
          </a-select>
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- Reset Password Modal -->
    <a-modal
      v-model:visible="resetPwdVisible"
      :title="t('auth.users.resetPasswordTitle')"
      :mask-closable="false"
      :ok-loading="resetPwdLoading"
      @ok="handleResetPassword"
      @cancel="resetPwdVisible = false"
    >
      <a-form :model="resetPwdForm" layout="vertical">
        <a-form-item :label="t('auth.users.resetPasswordPlaceholder')">
          <a-input-password
            v-model="resetPwdForm.new_password"
            :placeholder="t('auth.users.passwordPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { authUserApi, roleApi } from '@/api/rbac'
import { useCrud } from '@/composables/use-crud'
import { formatTime } from '@/utils/format'
import type { AuthUser, Role } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()

// Auxiliary data
const roles = ref<Role[]>([])

// Reset password modal
const resetPwdVisible = ref(false)
const resetPwdLoading = ref(false)
const resetPwdTarget = ref<AuthUser | null>(null)
const resetPwdForm = reactive({ new_password: '' })

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
} = useCrud<AuthUser, { keyword: string }>({
  fetchApi: authUserApi.list,
  createApi: authUserApi.create,
  updateApi: authUserApi.update,
  idField: 'id',
  fetchErrorMsg: t('auth.users.fetchFail'),
  defaultForm: () => ({
    username: '',
    password: '',
    display_name: '',
    role_id: undefined as number | undefined,
    status: 1,
  }),
  filterFn: (item, f) => {
    if (!f.keyword) return true
    const kw = f.keyword.toLowerCase()
    return item.username.toLowerCase().includes(kw) || item.display_name.toLowerCase().includes(kw)
  },
  immediateFilter: true,
})

const formRules = {
  username: [{ required: true, message: t('auth.users.usernameRequired') }],
  password: [
    { required: true, message: t('auth.users.passwordRequired') },
    { minLength: 8, message: t('auth.users.passwordMinLength') },
  ],
  display_name: [{ required: true, message: t('auth.users.displayNameRequired') }],
  role_id: [{ required: true, message: t('auth.users.roleRequired') }],
}

function handleDeleteUser(record: AuthUser) {
  Modal.confirm({
    title: t('common.confirm'),
    content: t('auth.users.confirmDelete', { name: record.display_name || record.username }),
    onOk: async () => {
      try {
        await authUserApi.delete(record.id)
        Message.success(t('common.deleteSuccess'))
        await fetchData()
      } catch {
        Message.error(t('common.deleteFail'))
      }
    },
  })
}

function openResetPassword(record: AuthUser) {
  resetPwdTarget.value = record
  resetPwdForm.new_password = ''
  resetPwdVisible.value = true
}

async function handleResetPassword() {
  if (!resetPwdForm.new_password || resetPwdForm.new_password.length < 8) {
    Message.warning(t('auth.users.passwordMinLength'))
    return
  }
  if (!resetPwdTarget.value) return
  resetPwdLoading.value = true
  try {
    await authUserApi.changePassword(resetPwdTarget.value.id, {
      new_password: resetPwdForm.new_password,
    })
    Message.success(t('auth.users.resetPasswordSuccess'))
    resetPwdVisible.value = false
  } catch {
    Message.error(t('auth.users.resetPasswordFail'))
  } finally {
    resetPwdLoading.value = false
  }
}

async function fetchRoles() {
  try {
    const res = await roleApi.list()
    roles.value = res.data
  } catch {
    // silently fail — role dropdown will be empty
  }
}

onMounted(() => {
  fetchData()
  fetchRoles()
})
</script>

<style scoped lang="less">
.user-page {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
</style>

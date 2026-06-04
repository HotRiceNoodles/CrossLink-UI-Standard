<template>
  <div>
    <div style="margin-bottom: 16px">
      <a-space>
        <a-select
          v-model="addForm.user_id"
          :placeholder="t('auth.organizations.selectUser')"
          allow-search
          :filterable="true"
          style="width: 200px"
        >
          <a-option
            v-for="user in userList"
            :key="user.id"
            :value="user.id"
            :label="`${user.username} (${user.display_name})`"
          />
        </a-select>
        <a-select
          v-model="addForm.role"
          :placeholder="t('auth.organizations.selectRole')"
          style="width: 140px"
        >
          <a-option value="owner" :label="t('auth.organizations.memberRoleOwner')" />
          <a-option value="admin" :label="t('auth.organizations.memberRoleAdmin')" />
          <a-option value="member" :label="t('auth.organizations.memberRoleMember')" />
          <a-option value="viewer" :label="t('auth.organizations.memberRoleViewer')" />
        </a-select>
        <a-button
          type="primary"
          :disabled="!addForm.user_id || !addForm.role"
          :loading="addLoading"
          @click="handleAddMember"
        >
          {{ t('auth.organizations.addMember') }}
        </a-button>
      </a-space>
    </div>

    <a-table
      :data="members"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="small"
      :bordered="false"
    >
      <template #columns>
        <a-table-column :title="t('auth.users.tableUsername')" data-index="username" :width="140" />

        <a-table-column
          :title="t('auth.users.tableDisplayName')"
          data-index="display_name"
          :width="140"
        />

        <a-table-column :title="t('auth.users.tableRole')" :width="160" align="center">
          <template #cell="{ record }">
            <a-select
              :model-value="record.role"
              size="small"
              style="width: 120px"
              @change="(val: string) => handleUpdateRole(record, val)"
            >
              <a-option value="owner" :label="t('auth.organizations.memberRoleOwner')" />
              <a-option value="admin" :label="t('auth.organizations.memberRoleAdmin')" />
              <a-option value="member" :label="t('auth.organizations.memberRoleMember')" />
              <a-option value="viewer" :label="t('auth.organizations.memberRoleViewer')" />
            </a-select>
          </template>
        </a-table-column>

        <a-table-column :title="t('common.actions')" :width="80" align="center">
          <template #cell="{ record }">
            <a-popconfirm
              :content="t('auth.organizations.removeConfirm')"
              type="warning"
              @ok="handleRemoveMember(record)"
            >
              <a-button type="text" size="small" status="danger">
                {{ t('auth.organizations.removeMember') }}
              </a-button>
            </a-popconfirm>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <a-empty v-if="!loading && members.length === 0" style="margin-top: 32px">
      {{ t('auth.organizations.noMembers') }}
    </a-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { orgApi, authUserApi } from '@/api/rbac'
import type { OrgMember, AuthUser } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  orgId: number
}>()

const loading = ref(false)
const addLoading = ref(false)
const members = ref<OrgMember[]>([])
const userList = ref<AuthUser[]>([])
const addForm = reactive({ user_id: undefined as number | undefined, role: 'member' })

async function fetchMembers() {
  if (!props.orgId) return
  loading.value = true
  try {
    const res = await orgApi.members(props.orgId)
    members.value = res.data
  } catch {
    Message.error(t('auth.organizations.fetchMembersFail'))
  } finally {
    loading.value = false
  }
}

async function fetchUsers() {
  try {
    const res = await authUserApi.list()
    userList.value = res.data
  } catch {
    // silently fail
  }
}

async function handleAddMember() {
  if (!addForm.user_id || !addForm.role || !props.orgId) return
  addLoading.value = true
  try {
    await orgApi.addMember(props.orgId, {
      user_id: addForm.user_id,
      role: addForm.role,
    })
    Message.success(t('common.createSuccess'))
    addForm.user_id = undefined
    addForm.role = 'member'
    await fetchMembers()
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    Message.error(error.response?.data?.error || t('common.operationFail'))
  } finally {
    addLoading.value = false
  }
}

async function handleUpdateRole(record: OrgMember, role: string) {
  if (!props.orgId) return
  try {
    await orgApi.updateMember(props.orgId, record.user_id, { role })
    Message.success(t('common.updateSuccess'))
    await fetchMembers()
  } catch {
    Message.error(t('common.operationFail'))
  }
}

async function handleRemoveMember(record: OrgMember) {
  if (!props.orgId) return
  try {
    await orgApi.removeMember(props.orgId, record.user_id)
    Message.success(t('common.deleteSuccess'))
    await fetchMembers()
  } catch {
    Message.error(t('common.deleteFail'))
  }
}

watch(
  () => props.orgId,
  (val) => {
    if (val) {
      fetchMembers()
      fetchUsers()
    }
  },
  { immediate: true },
)
</script>

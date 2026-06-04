<template>
  <a-drawer
    :visible="visible"
    :width="640"
    :title="t('auth.teams.memberTitle')"
    :mask-closable="false"
    unmount-on-close
    :footer="false"
    @cancel="handleClose"
  >
    <div style="margin-bottom: 16px">
      <a-space>
        <a-select
          v-model="addForm.user_id"
          :placeholder="t('auth.teams.selectUser')"
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
          :placeholder="t('auth.teams.selectRole')"
          style="width: 140px"
        >
          <a-option value="leader" :label="t('auth.teams.roleLeader')" />
          <a-option value="member" :label="t('auth.teams.roleMember')" />
        </a-select>
        <a-button
          type="primary"
          :disabled="!addForm.user_id || !addForm.role"
          :loading="addLoading"
          @click="handleAddMember"
        >
          {{ t('auth.teams.addMember') }}
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
        <a-table-column :title="t('auth.users.tableUsername')" :width="140">
          <template #cell="{ record }">
            {{ record.user?.username || '-' }}
          </template>
        </a-table-column>

        <a-table-column :title="t('auth.users.tableDisplayName')" :width="140">
          <template #cell="{ record }">
            {{ record.user?.display_name || '-' }}
          </template>
        </a-table-column>

        <a-table-column :title="t('auth.users.tableRole')" :width="100" align="center">
          <template #cell="{ record }">
            <a-tag :color="record.role === 'leader' ? 'blue' : 'arcoblue'">
              {{
                record.role === 'leader' ? t('auth.teams.roleLeader') : t('auth.teams.roleMember')
              }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column :title="t('common.actions')" :width="80" align="center">
          <template #cell="{ record }">
            <a-popconfirm
              :content="t('auth.teams.removeConfirm')"
              type="warning"
              @ok="handleRemoveMember(record)"
            >
              <a-button type="text" size="small" status="danger">
                {{ t('auth.teams.removeMember') }}
              </a-button>
            </a-popconfirm>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <a-empty v-if="!loading && members.length === 0" style="margin-top: 32px">
      {{ t('auth.teams.noMembers') }}
    </a-empty>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { teamApi, authUserApi } from '@/api/rbac'
import type { TeamMember, AuthUser } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  teamId: number
}>()

const visible = defineModel<boolean>('visible', { default: false })

const loading = ref(false)
const addLoading = ref(false)
const members = ref<TeamMember[]>([])
const userList = ref<AuthUser[]>([])
const addForm = reactive({ user_id: undefined as number | undefined, role: 'member' })

async function fetchMembers() {
  if (!props.teamId) return
  loading.value = true
  try {
    const res = await teamApi.members(props.teamId)
    members.value = res.data
  } catch {
    Message.error(t('auth.teams.fetchMembersFail'))
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
  if (!addForm.user_id || !addForm.role || !props.teamId) return
  addLoading.value = true
  try {
    await teamApi.addMember(props.teamId, {
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

async function handleRemoveMember(record: TeamMember) {
  if (!props.teamId) return
  try {
    await teamApi.removeMember(props.teamId, record.user_id)
    Message.success(t('common.deleteSuccess'))
    await fetchMembers()
  } catch {
    Message.error(t('common.deleteFail'))
  }
}

function handleClose() {
  visible.value = false
}

watch(visible, (val) => {
  if (val) {
    fetchMembers()
    fetchUsers()
  }
})
</script>

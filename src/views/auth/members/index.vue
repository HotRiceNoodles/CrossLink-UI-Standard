<template>
  <div class="members-page">
    <!-- Mobile team selector -->
    <div class="mobile-selector">
      <a-select
        :model-value="selectedTeamId ?? 'all'"
        :style="{ width: '100%' }"
        @change="handleMobileSelect"
      >
        <a-option value="all" :label="t('auth.members.allMembers')" />
        <a-option
          v-for="team in teams"
          :key="team.id"
          :value="team.id"
          :label="`${team.display_name} (${team.member_count})`"
        />
      </a-select>
    </div>

    <div class="members-layout">
      <!-- Left panel: team list -->
      <team-list-panel
        :teams="teams"
        :selected-team-id="selectedTeamId"
        :loading="loadingTeams"
        class="left-panel"
        @select="selectTeam"
        @create="handleCreateTeam"
      />

      <!-- Right panel -->
      <div class="right-panel">
        <!-- Team info header (visible when a team is selected) -->
        <team-header
          v-if="selectedTeam"
          :team="selectedTeam"
          @edit="handleEditTeam"
          @delete="handleDeleteTeam"
        />

        <!-- User table -->
        <user-table
          :rows="userRows"
          :loading="loadingUsers"
          :view-mode="viewMode"
          :selected-team="selectedTeam"
          :teams="teams"
          @edit="handleEditUser"
          @delete="handleDeleteUser"
          @reset-password="openResetPassword"
          @remove-from-team="handleRemoveFromTeam"
          @move-to-team="openMoveUserModal"
          @assign-to-team="openMoveUserModal"
          @add-user="handleCreateUser"
          @refresh="refreshAll"
        />
      </div>
    </div>

    <!-- User form drawer -->
    <user-form-drawer
      ref="userDrawerRef"
      :visible="userCrud.drawerVisible.value"
      :form-data="userCrud.formData"
      :is-edit="userCrud.isEdit.value"
      :submit-loading="userCrud.submitLoading.value"
      :roles="roles"
      :teams="teams"
      :preselect-team-id="selectedTeamId"
      @close="handleUserDrawerClose"
      @submit="handleUserDrawerSubmit"
      @update-field="(field: string, value: unknown) => (userCrud.formData[field] = value)"
    />

    <!-- Team form drawer -->
    <team-form-drawer
      ref="teamDrawerRef"
      :visible="teamCrud.drawerVisible.value"
      :form-data="teamCrud.formData"
      :is-edit="teamCrud.isEdit.value"
      :submit-loading="teamCrud.submitLoading.value"
      @close="handleTeamDrawerClose"
      @submit="handleTeamDrawerSubmit"
      @update-field="(field: string, value: unknown) => (teamCrud.formData[field] = value)"
    />

    <!-- Move user modal -->
    <move-user-modal
      v-model:visible="moveModalVisible"
      :user="moveTargetUser"
      :teams="teams"
      :current-team-id="moveFromTeamId"
      @confirm="handleMoveUser"
    />

    <!-- Reset password modal -->
    <reset-password-modal
      v-model:visible="resetPwdVisible"
      :user="resetPwdTarget"
      @confirm="handleResetPassword"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import { authUserApi, roleApi, teamApi } from '@/api/rbac'
import { useCrud } from '@/composables/use-crud'
import { useTeamUsers } from '@/composables/use-team-users'
import type { AuthUser, Role, Team } from '@/types'
import type { UserRow } from '@/composables/use-team-users'

import TeamListPanel from './components/team-list-panel.vue'
import TeamHeader from './components/team-header.vue'
import UserTable from './components/user-table.vue'
import UserFormDrawer from './components/user-form-drawer.vue'
import TeamFormDrawer from './components/team-form-drawer.vue'
import MoveUserModal from './components/move-user-modal.vue'
import ResetPasswordModal from './components/reset-password-modal.vue'

const { t } = useI18n()

// ─── Team-users composable ───
const {
  teams,
  selectedTeamId,
  selectedTeam,
  viewMode,
  userRows,
  loadingTeams,
  loadingUsers,
  selectTeam,
  refreshAll,
} = useTeamUsers()

// ─── Roles data ───
const roles = ref<Role[]>([])

async function fetchRoles() {
  try {
    const res = await roleApi.list()
    roles.value = res.data
  } catch {
    // silently fail
  }
}

// ─── Drawer component refs (for formRef access via defineExpose) ───
const userDrawerRef = ref<InstanceType<typeof UserFormDrawer>>()
const teamDrawerRef = ref<InstanceType<typeof TeamFormDrawer>>()

// ─── User CRUD ───
const userCrud = useCrud<AuthUser, Record<string, unknown>>({
  fetchApi: async () => ({ data: [] }),
  createApi: authUserApi.create,
  updateApi: authUserApi.update,
  idField: 'id',
  defaultForm: () => ({
    username: '',
    password: '',
    display_name: '',
    role_id: undefined as number | undefined,
    status: 1,
    team_id: undefined as number | undefined,
    team_role: 'member',
  }),
  onCreated: async (responseData) => {
    // Backend POST /users doesn't accept team_id/team_role yet (change 4).
    // After user creation, sequentially call addMember if team was selected.
    const createdUser = responseData as { id?: number }
    const tid = userCrud.formData.team_id as number | undefined
    if (tid && createdUser?.id) {
      try {
        await teamApi.addMember(tid, {
          user_id: createdUser.id,
          role: (userCrud.formData.team_role as string) || 'member',
        })
      } catch {
        Message.warning(t('common.operationFail'))
      }
    }
    await refreshAll()
    userCrud.handleDrawerClose()
  },
})

// ─── Team CRUD ───
const teamCrud = useCrud<Team, Record<string, unknown>>({
  fetchApi: async () => ({ data: [] }),
  createApi: teamApi.create,
  updateApi: teamApi.update,
  idField: 'id',
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
  onCreated: async () => {
    await refreshAll()
    teamCrud.handleDrawerClose()
  },
})

// ─── User drawer handlers ───
function handleCreateUser() {
  userCrud.handleCreate()
  // Pre-fill team_id with currently selected team
  if (selectedTeamId.value) {
    userCrud.formData.team_id = selectedTeamId.value
  }
}

function handleEditUser(record: UserRow) {
  userCrud.handleEdit(record as unknown as AuthUser)
}

function handleUserDrawerClose() {
  userCrud.handleDrawerClose()
}

async function handleUserDrawerSubmit() {
  // Wire up formRef from drawer component before submitting
  userCrud.formRef.value = userDrawerRef.value?.formRef
  await userCrud.handleDrawerSubmit()
}

// ─── Team drawer handlers ───
function handleCreateTeam() {
  teamCrud.handleCreate()
}

function handleEditTeam(record: Team) {
  teamCrud.handleEdit(record)
}

function handleTeamDrawerClose() {
  teamCrud.handleDrawerClose()
}

async function handleTeamDrawerSubmit() {
  // Wire up formRef from drawer component before submitting
  teamCrud.formRef.value = teamDrawerRef.value?.formRef
  await teamCrud.handleDrawerSubmit()
}

// ─── Delete team ───
function handleDeleteTeam(record: Team) {
  if (record.member_count > 0) {
    Message.warning(t('auth.members.deleteTeamWithMembers'))
    return
  }
  Modal.confirm({
    title: t('common.confirm'),
    content: t('auth.teams.confirmDelete', { name: record.display_name || record.name }),
    onOk: async () => {
      try {
        await teamApi.delete(record.id)
        Message.success(t('auth.teams.deleteSuccess'))
        if (selectedTeamId.value === record.id) {
          selectTeam(null)
        }
        await refreshAll()
      } catch {
        Message.error(t('common.deleteFail'))
      }
    },
  })
}

// ─── Delete user ───
function handleDeleteUser(record: UserRow) {
  Modal.confirm({
    title: t('common.confirm'),
    content: t('auth.users.confirmDelete', { name: record.display_name || record.username }),
    onOk: async () => {
      try {
        await authUserApi.delete(record.id)
        Message.success(t('common.deleteSuccess'))
        await refreshAll()
      } catch {
        Message.error(t('common.deleteFail'))
      }
    },
  })
}

// ─── Move user modal ───
const moveModalVisible = ref(false)
const moveTargetUser = ref<UserRow | null>(null)
const moveFromTeamId = ref<number | null>(null)

function openMoveUserModal(record: UserRow) {
  moveTargetUser.value = record
  // Determine source team: if in team view use selectedTeamId, if in all view try to find from record
  if (viewMode.value === 'team') {
    moveFromTeamId.value = selectedTeamId.value
  } else {
    // In all view, find the team by name
    const team = teams.value.find((t) => t.display_name === record.team_name)
    moveFromTeamId.value = team?.id ?? null
  }
  moveModalVisible.value = true
}

async function handleMoveUser(toTeamId: number) {
  if (!moveTargetUser.value) return
  const userId = moveTargetUser.value.id
  const fromTeamId = moveFromTeamId.value

  try {
    if (fromTeamId) {
      // Move between teams: try atomic API first, then fallback to sequential
      try {
        await teamApi.moveUser({
          user_id: userId,
          from_team_id: fromTeamId,
          to_team_id: toTeamId,
        })
      } catch {
        // Fallback: sequential remove + add
        await teamApi.removeMember(fromTeamId, userId)
        await teamApi.addMember(toTeamId, { user_id: userId, role: 'member' })
      }
    } else {
      // Assign to team (no source team): just addMember directly
      await teamApi.addMember(toTeamId, { user_id: userId, role: 'member' })
    }
    Message.success(t('common.updateSuccess'))
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    Message.error(error.response?.data?.error || t('common.operationFail'))
  }
  moveModalVisible.value = false
  await refreshAll()
}

// ─── Remove from team ───
function handleRemoveFromTeam(record: UserRow) {
  const teamId = selectedTeamId.value
  if (!teamId) return
  Modal.confirm({
    title: t('common.confirm'),
    content: t('auth.members.removeConfirm', {
      name: record.display_name || record.username,
      team: selectedTeam.value?.display_name || '',
    }),
    onOk: async () => {
      try {
        await teamApi.removeMember(teamId, record.id)
        Message.success(t('common.updateSuccess'))
        await refreshAll()
      } catch {
        Message.error(t('common.operationFail'))
      }
    },
  })
}

// ─── Reset password ───
const resetPwdVisible = ref(false)
const resetPwdTarget = ref<UserRow | null>(null)

function openResetPassword(record: UserRow) {
  resetPwdTarget.value = record
  resetPwdVisible.value = true
}

async function handleResetPassword(newPassword: string) {
  if (!resetPwdTarget.value) return
  try {
    await authUserApi.changePassword(resetPwdTarget.value.id, {
      new_password: newPassword,
    })
    Message.success(t('auth.users.resetPasswordSuccess'))
    resetPwdVisible.value = false
  } catch {
    Message.error(t('auth.users.resetPasswordFail'))
  }
}

// ─── Mobile select ───
function handleMobileSelect(val: number | 'all') {
  selectTeam(val === 'all' ? null : val)
}

// ─── Init ───
onMounted(() => {
  fetchRoles()
})
</script>

<style scoped lang="less">
.members-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.members-layout {
  display: flex;
  flex: 1;
  gap: 0;
  overflow: hidden;
}

.left-panel {
  flex-shrink: 0;
  width: 240px;
  border-inline-end: 1px solid var(--color-border);
  overflow-y: auto;
}

.right-panel {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.mobile-selector {
  display: none;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .members-layout {
    flex-direction: column;
  }

  .left-panel {
    display: none;
  }

  .mobile-selector {
    display: block;
  }

  .right-panel {
    padding: 12px;
  }
}
</style>

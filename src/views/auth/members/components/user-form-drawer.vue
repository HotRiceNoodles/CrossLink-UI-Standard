<template>
  <a-drawer
    :visible="visible"
    :width="560"
    :title="isEdit ? t('auth.users.editUser') : t('auth.users.createUser')"
    :mask-closable="false"
    unmount-on-close
    :ok-loading="submitLoading"
    @cancel="emit('close')"
    @ok="emit('submit')"
  >
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <a-form-item field="username" :label="t('auth.users.tableUsername')">
        <a-input
          :model-value="formData.username"
          :placeholder="t('auth.users.usernamePlaceholder')"
          :disabled="isEdit"
          @update:model-value="(val: string) => emit('updateField', 'username', val)"
        />
      </a-form-item>

      <a-form-item v-if="!isEdit" field="password" :label="t('login.password')">
        <a-input-password
          :model-value="formData.password"
          :placeholder="t('auth.users.passwordPlaceholder')"
          @update:model-value="(val: string) => emit('updateField', 'password', val)"
        />
      </a-form-item>

      <a-form-item field="display_name" :label="t('auth.users.tableDisplayName')">
        <a-input
          :model-value="formData.display_name"
          :placeholder="t('auth.users.displayNamePlaceholder')"
          @update:model-value="(val: string) => emit('updateField', 'display_name', val)"
        />
      </a-form-item>

      <a-form-item field="role_id" :label="t('auth.users.tableRole')">
        <a-select
          :model-value="formData.role_id"
          :placeholder="t('auth.users.roleRequired')"
          @update:model-value="(val: number) => emit('updateField', 'role_id', val)"
        >
          <a-option
            v-for="role in roles"
            :key="role.id"
            :value="role.id"
            :label="role.display_name || role.name"
          />
        </a-select>
      </a-form-item>

      <!-- Team assignment (create mode only) -->
      <a-form-item v-if="!isEdit" field="team_id" :label="t('auth.members.tableTeam')">
        <a-select
          :model-value="formData.team_id"
          :placeholder="t('common.all')"
          allow-clear
          @update:model-value="
            (val: number | undefined) => emit('updateField', 'team_id', val ?? undefined)
          "
        >
          <a-option
            v-for="team in teams"
            :key="team.id"
            :value="team.id"
            :label="team.display_name"
          />
        </a-select>
      </a-form-item>

      <a-form-item
        v-if="!isEdit && formData.team_id"
        field="team_role"
        :label="t('auth.members.tableTeamRole')"
      >
        <a-select
          :model-value="formData.team_role"
          @update:model-value="(val: string) => emit('updateField', 'team_role', val)"
        >
          <a-option value="leader" :label="t('auth.teams.roleLeader')" />
          <a-option value="member" :label="t('auth.teams.roleMember')" />
        </a-select>
      </a-form-item>

      <a-form-item v-if="isEdit" field="status" :label="t('common.status')">
        <a-select
          :model-value="formData.status"
          @update:model-value="(val: number) => emit('updateField', 'status', val)"
        >
          <a-option :value="1" :label="t('common.enabled')" />
          <a-option :value="0" :label="t('common.disabled')" />
        </a-select>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Role, Team } from '@/types'

const { t } = useI18n()

const formRef = ref()

defineProps<{
  visible: boolean
  formData: Record<string, unknown>
  isEdit: boolean
  submitLoading: boolean
  roles: Role[]
  teams: Team[]
  preselectTeamId: number | null
}>()

const emit = defineEmits<{
  close: []
  submit: []
  updateField: [field: string, value: unknown]
}>()

const formRules = {
  username: [{ required: true, message: t('auth.users.usernameRequired') }],
  password: [
    { required: true, message: t('auth.users.passwordRequired') },
    { minLength: 8, message: t('auth.users.passwordMinLength') },
  ],
  display_name: [{ required: true, message: t('auth.users.displayNameRequired') }],
  role_id: [{ required: true, message: t('auth.users.roleRequired') }],
}

defineExpose({ formRef })
</script>

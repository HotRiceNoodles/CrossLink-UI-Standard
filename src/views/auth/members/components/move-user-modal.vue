<template>
  <a-modal
    :visible="visible"
    :title="t('auth.members.moveToTeam')"
    :mask-closable="false"
    :ok-loading="loading"
    :ok-button-props="{ disabled: !selectedTeamId }"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div style="margin-bottom: 16px">
      <span style="color: var(--color-text-2)">
        {{ user?.display_name || user?.username }}
      </span>
    </div>
    <a-form layout="vertical">
      <a-form-item :label="t('auth.members.tableTeam')">
        <a-select
          v-model="selectedTeamId"
          :placeholder="t('auth.members.moveToTeam')"
          allow-search
          :filterable="true"
        >
          <a-option
            v-for="team in availableTeams"
            :key="team.id"
            :value="team.id"
            :label="team.display_name"
          />
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Team } from '@/types'
import type { UserRow } from '@/composables/use-team-users'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  user: UserRow | null
  teams: Team[]
  currentTeamId: number | null
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  confirm: [toTeamId: number]
}>()

const selectedTeamId = ref<number | undefined>()
const loading = ref(false)

// Filter out the current team
const availableTeams = computed(() => {
  if (!props.currentTeamId) return props.teams
  return props.teams.filter((t) => t.id !== props.currentTeamId)
})

// Reset selection when modal opens
watch(
  () => props.visible,
  (val) => {
    if (val) {
      selectedTeamId.value = undefined
    }
  },
)

function handleConfirm() {
  if (!selectedTeamId.value) return
  emit('confirm', selectedTeamId.value)
}

function handleCancel() {
  emit('update:visible', false)
}
</script>

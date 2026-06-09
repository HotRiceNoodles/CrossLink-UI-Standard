<template>
  <div class="team-header">
    <div class="team-header-main">
      <div class="team-title-row">
        <span class="team-name">{{ team.display_name }}</span>
        <a-space :size="4">
          <a-button
            v-if="userStore.hasPermission('team:update')"
            type="text"
            size="small"
            @click="emit('edit', team)"
          >
            {{ t('auth.members.editTeam') }}
          </a-button>
          <a-button
            v-if="userStore.hasPermission('team:delete')"
            type="text"
            size="small"
            status="danger"
            @click="emit('delete', team)"
          >
            {{ t('common.delete') }}
          </a-button>
        </a-space>
      </div>
      <div class="team-meta">
        <span>{{ t('auth.members.memberCount', { count: team.member_count }) }}</span>
        <template v-if="team.budget_limit">
          <span class="meta-sep">·</span>
          <span>¥{{ team.budget_limit }} / {{ budgetPeriodLabel }}</span>
        </template>
        <template v-if="team.tpm_limit">
          <span class="meta-sep">·</span>
          <span>TPM {{ team.tpm_limit }}</span>
        </template>
        <template v-if="team.rpm_limit">
          <span class="meta-sep">·</span>
          <span>RPM {{ team.rpm_limit }}</span>
        </template>
        <a-tag :color="team.status === 1 ? 'green' : 'red'" size="small" style="margin-left: 4px">
          {{ team.status === 1 ? t('common.enabled') : t('common.disabled') }}
        </a-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'
import type { Team } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()

const props = defineProps<{
  team: Team
}>()

const emit = defineEmits<{
  edit: [team: Team]
  delete: [team: Team]
}>()

const budgetPeriodLabel = computed(() => {
  const map: Record<string, string> = {
    daily: t('key.periodDay'),
    weekly: t('key.periodWeek'),
    monthly: t('key.periodMonth'),
  }
  return map[props.team.budget_period] || props.team.budget_period
})
</script>

<style scoped lang="less">
.team-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.team-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.team-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.team-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  font-size: 13px;
  color: var(--color-text-3);
}

.meta-sep {
  margin: 0 4px;
}
</style>

<template>
  <div class="org-card" :class="{ 'org-card--danger': healthStatus === 'danger' }">
    <!-- Header: Avatar + Name + Health Tag + Dropdown -->
    <div class="org-card__header">
      <div class="org-card__identity">
        <a-avatar :style="{ backgroundColor: avatarColor }" :size="40">
          {{ org.display_name?.charAt(0)?.toUpperCase() || '?' }}
        </a-avatar>
        <div class="org-card__name-block">
          <span class="org-card__display-name">{{ org.display_name }}</span>
          <span class="org-card__slug">{{ org.name }}</span>
        </div>
      </div>
      <div class="org-card__header-actions">
        <a-tag :color="healthTagColor" size="small">{{ healthLabel }}</a-tag>
        <a-dropdown trigger="hover" position="br">
          <a-button type="text" size="small" class="org-card__more">
            <template #icon><icon-more /></template>
          </a-button>
          <template #content>
            <a-doption v-if="userStore.hasPermission('org:update')" @click="emit('edit', org)">
              <template #icon><icon-edit /></template>
              {{ t('common.edit') }}
            </a-doption>
            <a-doption @click="emit('detail', org)">
              <template #icon><icon-eye /></template>
              {{ t('auth.organizations.detail') }}
            </a-doption>
            <a-doption
              v-if="userStore.hasPermission('org:delete')"
              class="org-card__delete-option"
              @click="emit('delete', org)"
            >
              <template #icon><icon-delete /></template>
              {{ t('common.delete') }}
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>

    <a-divider style="margin: 12px 0" />

    <!-- Stats Row -->
    <div class="org-card__stats">
      <div class="org-card__stat">
        <icon-user-group class="org-card__stat-icon" />
        <span class="org-card__stat-value">{{ org.member_count ?? '--' }}</span>
        <span class="org-card__stat-label">{{ t('auth.organizations.cardMembers') }}</span>
      </div>
      <div class="org-card__stat">
        <icon-nav class="org-card__stat-icon" />
        <span class="org-card__stat-value">{{ org.team_count ?? '--' }}</span>
        <span class="org-card__stat-label">{{ t('auth.organizations.cardTeams') }}</span>
      </div>
      <div class="org-card__stat">
        <icon-lock class="org-card__stat-icon" />
        <span class="org-card__stat-value">{{ org.key_count ?? '--' }}</span>
        <span class="org-card__stat-label">{{ t('auth.organizations.cardKeys') }}</span>
      </div>
    </div>

    <!-- Budget Section -->
    <div v-if="budget || org.budget_limit" class="org-card__budget">
      <div class="org-card__budget-header">
        <span class="org-card__budget-label">{{ t('auth.organizations.budgetUsage') }}</span>
        <span v-if="org.budget_limit" class="org-card__budget-limit">
          ¥{{ budget?.spent?.toFixed(2) ?? '0.00' }} / ¥{{ org.budget_limit }}/{{ periodLabel }}
        </span>
        <span v-else class="org-card__budget-limit">
          {{ t('auth.organizations.cardNoBudget') }}
        </span>
      </div>
      <a-progress
        v-if="budget"
        :percent="budget.usage_pct / 100"
        :color="progressColor"
        :text="`${budget.usage_pct.toFixed(1)}%`"
        size="large"
      />
    </div>

    <!-- Footer: Date + Enter Button -->
    <div class="org-card__footer">
      <span class="org-card__date">
        {{ t('auth.organizations.cardCreatedAt') }}: {{ formatDate(org.created_at) }}
      </span>
    </div>

    <a-button type="primary" long :disabled="org.status !== 1" @click="emit('enter', org)">
      <template #icon><icon-right /></template>
      {{ t('globalDashboard.enterOrg') }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'
import type { Organization, OrgBudget } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()

interface Props {
  org: Organization
  budget: OrgBudget | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit', org: Organization): void
  (e: 'detail', org: Organization): void
  (e: 'delete', org: Organization): void
  (e: 'enter', org: Organization): void
}>()

// Avatar color — hash-based from provider-card pattern
const avatarColor = computed(() => {
  const colors = [
    '#165DFF',
    '#00B42A',
    '#FF7D00',
    '#722ED1',
    '#0FC6C2',
    '#F77234',
    '#3491FA',
    '#9FDB1D',
  ]
  let hash = 0
  const name = props.org.display_name || props.org.name
  for (const ch of name) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  }
  return colors[Math.abs(hash) % colors.length]
})

// Progress color — same logic as budget-panel.vue
const progressColor = computed(() => {
  if (!props.budget) return 'arcoblue'
  const pct = props.budget.usage_pct
  if (pct >= 90) return 'red'
  if (pct >= 70) return 'orangered'
  return 'arcoblue'
})

// Health status indicator
type HealthStatus = 'healthy' | 'warning' | 'danger'

const healthStatus = computed<HealthStatus>(() => {
  if (props.org.status !== 1) return 'danger'
  if (!props.budget || !props.org.budget_limit) return 'healthy'
  if (props.budget.usage_pct >= 90) return 'danger'
  if (props.budget.usage_pct >= 70) return 'warning'
  return 'healthy'
})

const healthTagColor = computed(() => {
  const map: Record<HealthStatus, string> = {
    healthy: 'green',
    warning: 'orangered',
    danger: 'red',
  }
  return map[healthStatus.value]
})

const healthLabel = computed(() => {
  const map: Record<HealthStatus, string> = {
    healthy: t('globalDashboard.healthHealthy'),
    warning: t('globalDashboard.healthWarning'),
    danger: t('globalDashboard.healthDanger'),
  }
  return map[healthStatus.value]
})

// Budget period label
const periodLabel = computed(() => {
  const map: Record<string, string> = {
    daily: t('key.periodDay'),
    weekly: t('key.periodWeek'),
    monthly: t('key.periodMonth'),
  }
  return map[props.org.budget_period] || props.org.budget_period
})

// Format date
function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  return dateStr.slice(0, 10)
}
</script>

<style scoped lang="less">
.org-card {
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  padding: 16px;
  transition:
    box-shadow 0.2s,
    border-color 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: var(--color-border-3);
  }

  &--danger {
    border-inline-start: 3px solid rgb(var(--danger-6));
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  &__name-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__display-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__slug {
    font-size: 12px;
    color: var(--color-text-3);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__more {
    color: var(--color-text-3);
    flex-shrink: 0;
  }

  &__stats {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
  }

  &__stat-icon {
    color: var(--color-text-3);
    font-size: 14px;
  }

  &__stat-value {
    font-weight: 600;
    color: var(--color-text-1);
  }

  &__stat-label {
    color: var(--color-text-3);
  }

  &__budget {
    margin-bottom: 12px;
  }

  &__budget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  &__budget-label {
    font-size: 13px;
    color: var(--color-text-2);
  }

  &__budget-limit {
    font-size: 12px;
    color: var(--color-text-3);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__date {
    font-size: 12px;
    color: var(--color-text-4);
  }

  &__delete-option {
    color: rgb(var(--danger-6)) !important;
  }
}
</style>

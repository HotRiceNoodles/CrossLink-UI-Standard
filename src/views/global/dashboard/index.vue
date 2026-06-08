<template>
  <div class="global-dashboard">
    <div class="global-dashboard__header">
      <div>
        <h2 class="global-dashboard__title">{{ t('globalDashboard.title') }}</h2>
        <p class="global-dashboard__subtitle">
          {{ t('globalDashboard.subtitle', { name: userStore.user?.display_name || '' }) }}
        </p>
      </div>
    </div>

    <!-- Stats summary -->
    <div class="global-dashboard__stats">
      <a-statistic
        :title="t('globalDashboard.statOrgs')"
        :value="orgs.length"
        :value-style="{ fontSize: '28px', fontWeight: 600 }"
      >
        <template #prefix><icon-public /></template>
      </a-statistic>
      <a-statistic
        :title="t('globalDashboard.statMembers')"
        :value="totalMembers"
        :value-style="{ fontSize: '28px', fontWeight: 600 }"
      >
        <template #prefix><icon-user-group /></template>
      </a-statistic>
      <a-statistic
        :title="t('globalDashboard.statKeys')"
        :value="totalKeys"
        :value-style="{ fontSize: '28px', fontWeight: 600 }"
      >
        <template #prefix><icon-lock /></template>
      </a-statistic>
    </div>

    <!-- Organization cards grid -->
    <div v-if="orgs.length" class="global-dashboard__grid">
      <div v-for="org in orgs" :key="org.id" class="global-dashboard__org-card">
        <div class="global-dashboard__org-header">
          <div class="global-dashboard__org-identity">
            <a-avatar :style="{ backgroundColor: avatarColor(org) }" :size="44">
              {{ org.display_name?.charAt(0)?.toUpperCase() || '?' }}
            </a-avatar>
            <div>
              <div class="global-dashboard__org-name">{{ org.display_name }}</div>
              <div class="global-dashboard__org-slug">{{ org.name }}</div>
            </div>
          </div>
          <a-tag v-if="org.status === 1" color="green" size="small">
            {{ t('common.active') }}
          </a-tag>
          <a-tag v-else color="red" size="small">
            {{ t('common.disabled') }}
          </a-tag>
        </div>

        <div class="global-dashboard__org-stats">
          <span>
            <icon-user-group class="global-dashboard__org-stat-icon" />
            {{ org.member_count ?? 0 }}
          </span>
          <span>
            <icon-nav class="global-dashboard__org-stat-icon" />
            {{ org.team_count ?? 0 }}
          </span>
          <span>
            <icon-lock class="global-dashboard__org-stat-icon" />
            {{ org.key_count ?? 0 }}
          </span>
        </div>

        <a-button
          type="primary"
          long
          :disabled="org.status !== 1 || entering === org.id"
          :loading="entering === org.id"
          @click="handleEnterOrg(org)"
        >
          <template #icon><icon-right /></template>
          {{ t('globalDashboard.enterOrg') }}
        </a-button>
      </div>
    </div>

    <!-- Empty state -->
    <a-empty v-else class="global-dashboard__empty">
      <template #image>
        <icon-public :size="64" />
      </template>
      <div class="global-dashboard__empty-title">{{ t('globalDashboard.emptyTitle') }}</div>
      <div class="global-dashboard__empty-desc">{{ t('globalDashboard.emptyDesc') }}</div>
      <a-button type="primary" @click="router.push({ name: 'globalOrganizations' })">
        <template #icon><icon-plus /></template>
        {{ t('globalDashboard.createFirst') }}
      </a-button>
    </a-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'
import type { Organization } from '@/types'
import { Message } from '@arco-design/web-vue'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const entering = ref<number | null>(null)

const orgs = computed(() => userStore.availableOrgs)

const totalMembers = computed(() => orgs.value.reduce((sum, o) => sum + (o.member_count ?? 0), 0))

const totalKeys = computed(() => orgs.value.reduce((sum, o) => sum + (o.key_count ?? 0), 0))

const COLORS = [
  '#165DFF',
  '#00B42A',
  '#FF7D00',
  '#722ED1',
  '#0FC6C2',
  '#F77234',
  '#3491FA',
  '#9FDB1D',
]

function avatarColor(org: Organization) {
  let hash = 0
  const name = org.display_name || org.name
  for (const ch of name) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

async function handleEnterOrg(org: Organization) {
  if (entering.value) return
  entering.value = org.id
  try {
    await userStore.switchOrg(org.id)
    router.push(`/org/${org.id}/dashboard`)
  } catch {
    Message.error(t('org.switcher.switchFailed'))
  } finally {
    entering.value = null
  }
}
</script>

<style scoped lang="less">
.global-dashboard {
  &__header {
    margin-bottom: 24px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
    margin: 0 0 4px;
  }

  &__subtitle {
    font-size: 14px;
    color: var(--color-text-3);
    margin: 0;
  }

  &__stats {
    display: flex;
    gap: 32px;
    background: var(--color-bg-2);
    border: 1px solid var(--color-border-2);
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 24px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  &__org-card {
    background: var(--color-bg-2);
    border: 1px solid var(--color-border-2);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: var(--color-border-3);
    }
  }

  &__org-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  &__org-identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  &__org-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__org-slug {
    font-size: 12px;
    color: var(--color-text-3);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  &__org-stats {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--color-text-2);

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  &__org-stat-icon {
    color: var(--color-text-3);
    font-size: 14px;
  }

  &__empty {
    padding: 64px 0;
  }

  &__empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
    margin-top: 12px;
  }

  &__empty-desc {
    font-size: 14px;
    color: var(--color-text-3);
    margin: 4px 0 16px;
  }
}
</style>

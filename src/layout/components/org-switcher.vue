<template>
  <div class="org-switcher">
    <a-dropdown v-if="userStore.isPlatformAdmin" trigger="click" position="bottom">
      <a-button type="text" size="small" class="org-switcher-trigger">
        <template #icon>
          <icon-public v-if="!userStore.hasOrgContext" />
          <icon-storage v-else />
        </template>
        {{ displayLabel }}
        <icon-down class="org-switcher-arrow" />
      </a-button>
      <template #content>
        <div class="org-search-panel" @click.stop>
          <a-input-search
            v-model="searchQuery"
            :placeholder="t('org.switcher.searchPlaceholder')"
            allow-clear
            size="small"
          />
          <div class="org-list">
            <a-doption
              v-for="org in filteredOrgs"
              :key="org.id"
              :class="{ 'org-item-active': org.id === userStore.currentOrgId }"
              @click="handleSwitchOrg(org)"
            >
              <template #icon><icon-storage /></template>
              {{ org.display_name || org.name }}
            </a-doption>
            <div v-if="!filteredOrgs.length" class="org-list-empty">
              {{ t('org.switcher.noResults') }}
            </div>
          </div>
          <a-divider style="margin: 4px 0" />
          <a-doption @click="handleBackToPlatform">
            <template #icon><icon-dashboard /></template>
            {{ t('org.switcher.backToPlatform') }}
          </a-doption>
        </div>
      </template>
    </a-dropdown>
    <span v-else-if="userStore.hasOrgContext" class="org-switcher-label">
      <icon-storage />
      {{ userStore.currentOrg?.orgName }}
    </span>
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

const searchQuery = ref('')
const switching = ref(false)

const displayLabel = computed(() => {
  if (userStore.currentOrg) return userStore.currentOrg.orgName
  return t('org.switcher.platformOverview')
})

const filteredOrgs = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return userStore.availableOrgs
  return userStore.availableOrgs.filter(
    (org) => org.display_name.toLowerCase().includes(q) || org.name.toLowerCase().includes(q),
  )
})

async function handleSwitchOrg(org: Organization) {
  if (switching.value) return
  switching.value = true
  try {
    await userStore.switchOrg(org.id)
    router.push(`/org/${org.id}/dashboard`)
  } catch {
    Message.error(t('org.switcher.switchFailed'))
  } finally {
    switching.value = false
  }
}

async function handleBackToPlatform() {
  if (switching.value) return
  switching.value = true
  try {
    await userStore.switchOrg(0)
    router.push({ name: 'globalDashboard' })
  } catch {
    Message.error(t('org.switcher.switchFailed'))
  } finally {
    switching.value = false
  }
}
</script>

<style scoped lang="less">
.org-switcher {
  display: flex;
  align-items: center;
}

.org-switcher-trigger {
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 500;
  gap: 4px;

  &:hover {
    color: var(--color-text-1);
  }

  :deep(.arco-btn-icon) {
    margin-inline-end: 2px;
  }
}

.org-switcher-arrow {
  font-size: 12px;
  margin-inline-start: 2px;
  opacity: 0.5;
}

.org-switcher-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
  padding: 0 8px;
  border-inline-start: 1px solid var(--color-border);
  margin-inline-start: 4px;
}

.org-search-panel {
  padding: 4px;
  min-width: 220px;
}

.org-list {
  max-height: 240px;
  overflow-y: auto;
  margin-top: 4px;
}

.org-item-active {
  font-weight: 600;
  color: rgb(var(--primary-6));
}

.org-list-empty {
  padding: 12px 8px;
  text-align: center;
  color: var(--color-text-4);
  font-size: 12px;
}
</style>

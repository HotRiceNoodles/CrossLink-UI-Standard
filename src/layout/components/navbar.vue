<template>
  <header class="navbar">
    <div class="navbar-left">
      <a-button type="text" size="small" @click="appStore.toggleMenuCollapse()">
        <template #icon>
          <icon-menu-fold v-if="!menuCollapse" />
          <icon-menu-unfold v-else />
        </template>
      </a-button>
      <a-breadcrumb class="navbar-breadcrumb">
        <a-breadcrumb-item v-for="matched in breadcrumbItems" :key="matched.path">
          {{ matched.locale }}
        </a-breadcrumb-item>
      </a-breadcrumb>
      <org-switcher v-if="showOrgSwitcher" />
    </div>
    <div class="navbar-right">
      <a-tooltip v-if="canRunOnboarding" :content="t('onboarding.title')" position="bottom">
        <a-button type="text" size="small" class="onboarding-btn" @click="runOnboarding">
          <template #icon><icon-tool /></template>
          <span class="onboarding-btn__label">{{ t('onboarding.title') }}</span>
        </a-button>
      </a-tooltip>
      <language-switch
        :current-locale="currentLocale"
        @change="(lang: string) => emit('languageChange', lang)"
      />
      <a-tag
        class="tier-tag"
        :color="userStore.tier === 'community' ? 'arcoblue' : 'green'"
        size="small"
      >
        {{ tierLabel }}
      </a-tag>
      <a-dropdown trigger="hover">
        <a-button type="text" size="small">
          {{ userStore.user?.display_name || t('login.user') }}
          <template #icon><icon-down /></template>
        </a-button>
        <template #content>
          <a-doption @click="emit('changePassword')">
            <template #icon><icon-lock /></template>
            {{ t('profile.changePassword') }}
          </a-doption>
          <a-doption @click="emit('logout')">
            <template #icon><icon-export /></template>
            {{ t('login.logout') }}
          </a-doption>
        </template>
      </a-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAppStore, useUserStore } from '@/store'
import { useTierLabel } from '@/utils/license'
import { useOnboardingGuard } from '@/composables/use-onboarding-wizard'
import LanguageSwitch from './language-switch.vue'
import OrgSwitcher from './org-switcher.vue'

const { t } = useI18n()
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const tierLabelFn = useTierLabel()

defineProps<{
  menuCollapse: boolean
  currentLocale: string
}>()

const emit = defineEmits<{
  languageChange: [lang: string]
  changePassword: []
  logout: []
}>()

const breadcrumbItems = computed(() => {
  return route.matched
    .filter((r) => r.meta?.menuKey)
    .map((r) => ({ path: r.path, locale: t(`menu.${r.meta?.menuKey}`) as string }))
})

const tierLabel = computed(() => tierLabelFn(userStore.tier))

const showOrgSwitcher = computed(
  () => userStore.isEnterprise && (userStore.isPlatformAdmin || userStore.hasOrgContext),
)

// 配置向导按钮：仅有 provider:create 权限、且不在企业版全局视角（无主资源风险）时可见。
const { blocked: onboardingBlocked, runOnboarding } = useOnboardingGuard()
const canRunOnboarding = computed(
  () => userStore.hasPermission('provider:create') && !onboardingBlocked.value,
)
</script>

<style scoped lang="less">
.navbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.navbar-breadcrumb {
  margin-inline-start: 4px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .navbar-breadcrumb {
    display: none;
  }

  .navbar-right .tier-tag {
    display: none;
  }

  .onboarding-btn__label {
    display: none;
  }
}
</style>

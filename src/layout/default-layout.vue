<template>
  <div class="layout">
    <aside class="layout-sider" :class="{ collapsed: menuCollapse }">
      <div class="logo-area">
        <img src="@/assets/images/CrossLinkLogo.png" alt="CrossLink" class="logo-img" />
        <transition name="fade">
          <span v-show="!menuCollapse" class="logo-text">CrossLink</span>
        </transition>
      </div>
      <a-menu
        :selected-keys="selectedKeys"
        :open-keys="openKeys"
        :style="{ width: '100%' }"
        @menu-item-click="onMenuItemClick"
        @sub-menu-click="onSubMenuClick"
      >
        <template v-for="route in menuRoutes" :key="route.name as string">
          <a-sub-menu
            v-if="route.children?.length && route.meta?.isMenuGroup"
            :key="route.name as string"
          >
            <template #icon>
              <component :is="(route.meta?.icon as string)" />
            </template>
            <template #title>{{ t(`menu.${route.meta?.menuKey}`) }}</template>
            <a-menu-item
              v-for="child in route.children"
              :key="child.name as string"
            >
              <template #icon>
                <component :is="(child.meta?.icon as string)" />
              </template>
              {{ t(`menu.${child.meta?.menuKey}`) }}
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="route.name as string">
            <template #icon>
              <component :is="(route.meta?.icon as string)" />
            </template>
            {{ t(`menu.${route.meta?.menuKey}`) }}
          </a-menu-item>
        </template>
      </a-menu>
      <div class="sidebar-footer">
        <span class="version-text" @click="onVersionTap">v1.0.0</span>
      </div>
    </aside>

    <div class="layout-main" :class="{ 'sider-collapsed': menuCollapse }">
      <header class="navbar">
        <div class="navbar-left">
          <a-button
            type="text"
            size="small"
            @click="appStore.toggleMenuCollapse()"
          >
            <template #icon>
              <icon-menu-fold v-if="!menuCollapse" />
              <icon-menu-unfold v-else />
            </template>
          </a-button>
          <a-breadcrumb class="navbar-breadcrumb">
            <a-breadcrumb-item
              v-for="matched in breadcrumbItems"
              :key="matched.path"
            >
              {{ matched.locale }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="navbar-right">
          <a-dropdown trigger="hover" @select="onLanguageSelect">
            <a-button type="text" size="small">
              <icon-language />
              <icon-down />
            </a-button>
            <template #content>
              <a-doption value="zh-CN" :class="{ 'lang-active': currentLocale === 'zh-CN' }">
                简体中文
              </a-doption>
              <a-doption value="en-US" :class="{ 'lang-active': currentLocale === 'en-US' }">
                English
              </a-doption>
            </template>
          </a-dropdown>
          <a-tag
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
              <a-doption @click="passwordVisible = true">
                <template #icon><icon-lock /></template>
                {{ t('profile.changePassword') }}
              </a-doption>
              <a-doption @click="handleLogout">
                <template #icon><icon-export /></template>
                {{ t('login.logout') }}
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </header>

      <main class="layout-content">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>

    <change-password-modal v-model:visible="passwordVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore, useUserStore } from '@/store'
import { changeLanguage, getCurrentLocale } from '@/locale'
import ChangePasswordModal from '@/views/profile/components/change-password-modal.vue'
import appRoutes from '@/router/routes'
import { authApi } from '@/api/auth'

let devLogsAdded = false
import { Message, Modal } from '@arco-design/web-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { t } = useI18n()

const currentLocale = ref(getCurrentLocale())

const menuCollapse = computed(() => appStore.menuCollapse)
const passwordVisible = ref(false)

const menuRoutes = computed(() => {
  return (appRoutes.children || []) as RouteRecordRaw[]
})

const selectedKeys = computed(() => {
  return [route.name as string]
})

const openKeys = ref<string[]>([])

function onSubMenuClick(key: string) {
  const idx = openKeys.value.indexOf(key)
  if (idx >= 0) {
    openKeys.value.splice(idx, 1)
  } else {
    openKeys.value.push(key)
  }
}

watch(() => route.name, () => {
  if (menuCollapse.value) {
    openKeys.value = []
    return
  }
  const matched = (menuRoutes.value as RouteRecordRaw[])
    .filter((r) => r.children?.some((c: RouteRecordRaw) => c.name === route.name))
    .map((r) => r.name as string)
  if (matched.length && !matched.every((k) => openKeys.value.includes(k))) {
    openKeys.value = matched
  }
}, { immediate: true })

watch(menuCollapse, (val) => {
  if (val) openKeys.value = []
})

const breadcrumbItems = computed(() => {
  return route.matched
    .filter((r) => r.meta?.menuKey)
    .map((r) => ({ path: r.path, locale: t(`menu.${r.meta?.menuKey}`) as string }))
})

const tierLabel = computed(() => {
  const map: Record<string, string> = {
    community: t('tier.community'),
    pro: t('tier.pro'),
    enterprise: t('tier.enterprise'),
  }
  return map[userStore.tier] || t('tier.community')
})

function onMenuItemClick(key: string) {
  router.push({ name: key })
}

function onLanguageSelect(value: string | number | boolean | Record<string, unknown> | undefined) {
  const lang = String(value)
  changeLanguage(lang)
  currentLocale.value = lang
}

async function handleLogout() {
  Modal.confirm({
    title: t('login.logoutConfirm'),
    content: t('login.logoutContent'),
    okText: t('login.logoutOk'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        await authApi.logout()
      } catch {
        // ignore
      }
      userStore.logout()
      router.push({ name: 'login' })
      Message.success(t('login.loggedOut'))
    },
  })
}

const tapCount = ref(0)
let tapTimer: ReturnType<typeof setTimeout> | null = null

function onVersionTap() {
  tapCount.value++
  if (tapTimer) clearTimeout(tapTimer)
  tapTimer = setTimeout(() => { tapCount.value = 0 }, 1500)

  if (tapCount.value >= 5) {
    tapCount.value = 0
    if (devLogsAdded) {
      router.push('/dev/logs')
      return
    }
    router.addRoute('root', {
      path: 'dev/logs',
      name: 'DevLogs',
      component: () => import('@/logger/views/log-viewer.vue'),
    })
    devLogsAdded = true
    router.push('/dev/logs')
  }
}
</script>

<style scoped lang="less">
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layout-sider {
  flex-shrink: 0;
  width: 240px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
  overflow: hidden;

  &.collapsed {
    width: 48px;
  }
}

.logo-area {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-fill-2);
  flex-shrink: 0;
}

.logo-img {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
}

.logo-text {
  margin-left: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.navbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid var(--color-border);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.navbar-breadcrumb {
  margin-left: 4px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-active {
  font-weight: 600;
}

.layout-content {
  flex: 1;
  padding: 20px;
  background: var(--color-fill-2);
  overflow: auto;
}

.sidebar-footer {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid var(--color-fill-2);
  text-align: center;
}

.version-text {
  font-size: 11px;
  color: var(--color-text-4);
  cursor: default;
  user-select: none;
}
</style>

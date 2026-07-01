<template>
  <div class="layout">
    <!-- Desktop: inline sidebar -->
    <sidebar
      v-if="device === 'desktop'"
      :menu-collapse="menuCollapse"
      :menu-routes="menuRoutes"
      :footer-routes="footerRoutes"
      :selected-keys="selectedKeys"
      :open-keys="openKeys"
      @menu-item-click="onMenuItemClick"
      @sub-menu-click="onSubMenuClick"
      @version-tap="onVersionTap"
    />

    <!-- Mobile: drawer sidebar -->
    <a-drawer
      v-else
      :visible="!menuCollapse"
      placement="left"
      :width="240"
      :footer="false"
      :header="false"
      :closable="false"
      @cancel="appStore.toggleMenuCollapse()"
    >
      <sidebar
        :menu-collapse="false"
        :menu-routes="menuRoutes"
        :footer-routes="footerRoutes"
        :selected-keys="selectedKeys"
        :open-keys="openKeys"
        @menu-item-click="onMobileMenuItemClick"
        @sub-menu-click="onSubMenuClick"
        @version-tap="onVersionTap"
      />
    </a-drawer>

    <div class="layout-main" :class="{ 'sider-collapsed': menuCollapse && device === 'desktop' }">
      <navbar
        :menu-collapse="menuCollapse"
        :current-locale="currentLocale"
        @language-change="onLanguageChange"
        @change-password="passwordVisible = true"
        @logout="handleLogout"
      />

      <main class="layout-content">
        <router-view v-slot="{ Component }">
          <keep-alive :include="['Dashboard', 'GlobalDashboard']">
            <component :is="Component" />
          </keep-alive>
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
import { useBreakpoints } from '@vueuse/core'
import { useAppStore, useUserStore } from '@/store'
import { changeLanguage, getCurrentLocale } from '@/locale'
import ChangePasswordModal from './components/change-password-modal.vue'
import { authApi } from '@/api/auth'
import { Message, Modal } from '@arco-design/web-vue'
import Sidebar from './components/sidebar.vue'
import Navbar from './components/navbar.vue'

let devLogsAdded = false

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { t } = useI18n()

const currentLocale = ref(getCurrentLocale())

const menuCollapse = computed(() => appStore.menuCollapse)
const device = computed(() => appStore.device)
const passwordVisible = ref(false)

const breakpoints = useBreakpoints({ mobile: 768 })
const isMobile = breakpoints.smaller('mobile')

watch(
  isMobile,
  (mobile) => {
    appStore.device = mobile ? 'mobile' : 'desktop'
    if (mobile) appStore.menuCollapse = true
  },
  { immediate: true },
)

const menuRoutes = computed(() => {
  const activeParent = route.matched.find((m) => m.name === 'orgRoot' || m.name === 'default')
  const children = (activeParent?.children || []) as RouteRecordRaw[]
  const isDefaultRoute = activeParent?.name === 'default'
  // Enterprise admin on default route sees only admin modules (overview, organizations)
  const isAdminMode = isDefaultRoute && userStore.isEnterprise && userStore.isPlatformAdmin

  return children.filter((r) => {
    // Footer-positioned routes are excluded from the main menu
    if (r.meta?.sidebarFooter) return false

    // Tier check
    const requiredTier = r.meta?.requiredTier
    if (requiredTier) {
      const allowed = Array.isArray(requiredTier)
        ? requiredTier.includes(userStore.tier)
        : userStore.tier === requiredTier
      if (!allowed) return false
    }

    // Platform admin check on individual routes
    const requiresAdmin = !!r.meta?.requiresPlatformAdmin
    if (requiresAdmin && !userStore.isPlatformAdmin) return false

    // Permission check
    const requiredPermission = r.meta?.requiredPermission as string | undefined
    if (requiredPermission && !userStore.hasPermission(requiredPermission)) return false

    // In admin mode (enterprise admin on default route): only show admin modules
    // In feature mode: hide admin modules
    if (isAdminMode) {
      return requiresAdmin
    } else {
      return !requiresAdmin
    }
  })
})

// Footer routes — always visible regardless of admin/feature mode
const footerRoutes = computed(() => {
  const activeParent = route.matched.find((m) => m.name === 'orgRoot' || m.name === 'default')
  const children = (activeParent?.children || []) as RouteRecordRaw[]
  return children
    .filter((r) => !!r.meta?.sidebarFooter)
    .filter((r) => {
      const requiredPermission = r.meta?.requiredPermission as string | undefined
      return !requiredPermission || userStore.hasPermission(requiredPermission)
    })
    .sort((a, b) => ((a.meta?.order as number) ?? 999) - ((b.meta?.order as number) ?? 999))
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

watch(
  () => route.name,
  () => {
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
  },
  { immediate: true },
)

watch(menuCollapse, (val) => {
  if (val) openKeys.value = []
})

function onMenuItemClick(key: string) {
  router.push({ name: key })
}

function onMobileMenuItemClick(key: string) {
  router.push({ name: key })
  appStore.menuCollapse = true
}

function onLanguageChange(lang: string) {
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
  tapTimer = setTimeout(() => {
    tapCount.value = 0
  }, 1500)

  if (tapCount.value >= 5) {
    tapCount.value = 0
    if (devLogsAdded) {
      router.push('/dev/logs')
      return
    }
    router.addRoute('default', {
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

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  padding: 20px;
  background: var(--color-fill-2);
  overflow: auto;
}
</style>

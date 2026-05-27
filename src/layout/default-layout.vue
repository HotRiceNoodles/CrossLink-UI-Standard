<template>
  <div class="layout">
    <sidebar
      :menu-collapse="menuCollapse"
      :menu-routes="menuRoutes"
      :selected-keys="selectedKeys"
      :open-keys="openKeys"
      @menu-item-click="onMenuItemClick"
      @sub-menu-click="onSubMenuClick"
      @version-tap="onVersionTap"
    />

    <div class="layout-main" :class="{ 'sider-collapsed': menuCollapse }">
      <navbar
        :menu-collapse="menuCollapse"
        :current-locale="currentLocale"
        @language-change="onLanguageChange"
        @change-password="passwordVisible = true"
        @logout="handleLogout"
      />

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

function onMenuItemClick(key: string) {
  router.push({ name: key })
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

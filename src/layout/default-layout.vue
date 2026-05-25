<template>
  <div class="layout">
    <aside class="layout-sider" :class="{ collapsed: menuCollapse }">
      <div class="logo-area">
        <div class="logo-icon">CL</div>
        <transition name="fade">
          <span v-show="!menuCollapse" class="logo-text">CrossLink</span>
        </transition>
      </div>
      <a-menu
        :selected-keys="selectedKeys"
        :style="{ width: '100%' }"
        @menu-item-click="onMenuItemClick"
      >
        <a-menu-item
          v-for="route in menuRoutes"
          :key="route.name as string"
        >
          <template #icon>
            <component :is="(route.meta?.icon as string)" />
          </template>
          {{ route.meta?.locale }}
        </a-menu-item>
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
            <a-breadcrumb-item>{{ currentLocale }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="navbar-right">
          <a-tag
            :color="userStore.tier === 'community' ? 'arcoblue' : 'green'"
            size="small"
          >
            {{ tierLabel }}
          </a-tag>
          <a-dropdown trigger="hover">
            <a-button type="text" size="small">
              {{ userStore.user?.display_name || '用户' }}
              <template #icon><icon-down /></template>
            </a-button>
            <template #content>
              <a-doption @click="handleLogout">
                <template #icon><icon-export /></template>
                退出登录
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAppStore, useUserStore } from '@/store'
import appRoutes from '@/router/routes'
import { authApi } from '@/api/auth'
import { Message, Modal } from '@arco-design/web-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const menuCollapse = computed(() => appStore.menuCollapse)

const menuRoutes = computed(() => {
  return (appRoutes.children || []) as RouteRecordRaw[]
})

const selectedKeys = computed(() => {
  return [route.name as string]
})

const currentLocale = computed(() => {
  return (route.meta?.locale || '') as string
})

const tierLabel = computed(() => {
  const map: Record<string, string> = {
    community: '社区版',
    pro: '专业版',
    enterprise: '企业版',
  }
  return map[userStore.tier] || '社区版'
})

function onMenuItemClick(key: string) {
  router.push({ name: key })
}

async function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '退出',
    cancelText: '取消',
    onOk: async () => {
      try {
        await authApi.logout()
      } catch {
        // ignore
      }
      userStore.logout()
      router.push({ name: 'login' })
      Message.success('已退出登录')
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
    router.addRoute('root', {
      path: 'dev/logs',
      name: 'DevLogs',
      component: () => import('@/logger/views/log-viewer.vue'),
    })
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

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #165dff, #4080ff);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
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

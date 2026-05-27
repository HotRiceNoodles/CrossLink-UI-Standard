<template>
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
      @menu-item-click="(key: string) => emit('menuItemClick', key)"
      @sub-menu-click="(key: string) => emit('subMenuClick', key)"
    >
      <template v-for="route in menuRoutes" :key="route.name as string">
        <a-sub-menu
          v-if="route.children?.length && route.meta?.isMenuGroup"
          :key="route.name as string"
        >
          <template #icon>
            <component :is="route.meta?.icon as string" />
          </template>
          <template #title>{{ t(`menu.${route.meta?.menuKey}`) }}</template>
          <a-menu-item v-for="child in route.children" :key="child.name as string">
            <template #icon>
              <component :is="child.meta?.icon as string" />
            </template>
            {{ t(`menu.${child.meta?.menuKey}`) }}
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item v-else :key="route.name as string">
          <template #icon>
            <component :is="route.meta?.icon as string" />
          </template>
          {{ t(`menu.${route.meta?.menuKey}`) }}
        </a-menu-item>
      </template>
    </a-menu>
    <div class="sidebar-footer">
      <span class="version-text" @click="emit('versionTap')">v{{ version }}</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RouteRecordRaw } from 'vue-router'

const { t } = useI18n()
const version = __APP_VERSION__

defineProps<{
  menuCollapse: boolean
  menuRoutes: RouteRecordRaw[]
  selectedKeys: string[]
  openKeys: string[]
}>()

const emit = defineEmits<{
  menuItemClick: [key: string]
  subMenuClick: [key: string]
  versionTap: []
}>()
</script>

<style scoped lang="less">
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

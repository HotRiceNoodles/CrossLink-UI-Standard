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
          v-if="route.meta?.isMenuGroup && visibleChildren(route).length"
          :key="route.name as string"
        >
          <template #icon>
            <component :is="route.meta?.icon as string" />
          </template>
          <template #title>{{ t(`menu.${route.meta?.menuKey}`) }}</template>
          <a-menu-item v-for="child in visibleChildren(route)" :key="child.name as string">
            <template #icon>
              <component :is="child.meta?.icon as string" />
            </template>
            {{ t(`menu.${child.meta?.menuKey}`) }}
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item v-else-if="!route.meta?.isMenuGroup" :key="route.name as string">
          <template #icon>
            <component :is="route.meta?.icon as string" />
          </template>
          {{ t(`menu.${route.meta?.menuKey}`) }}
        </a-menu-item>
      </template>
    </a-menu>
    <div class="sidebar-footer">
      <div v-if="footerRoutes.length" class="footer-actions">
        <a-tooltip
          v-for="fr in footerRoutes"
          :key="fr.name as string"
          :content="t(`menu.${fr.meta?.menuKey}`)"
          position="right"
          mini
          :disabled="!menuCollapse"
        >
          <div
            class="footer-action-item"
            :class="{ active: selectedKeys.includes(fr.name as string) }"
            @click="emit('menuItemClick', fr.name as string)"
          >
            <component :is="fr.meta?.icon as string" class="footer-action-icon" />
            <transition name="fade">
              <span v-show="!menuCollapse" class="footer-action-label">
                {{ t(`menu.${fr.meta?.menuKey}`) }}
              </span>
            </transition>
          </div>
        </a-tooltip>
      </div>
      <span class="version-text" @click="emit('versionTap')">v{{ version }}</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RouteRecordRaw } from 'vue-router'
import { useMenuVisibility } from '@/hooks/menu-visibility'

const { t } = useI18n()
const version = __APP_VERSION__
const { isVisible } = useMenuVisibility()

defineProps<{
  menuCollapse: boolean
  menuRoutes: RouteRecordRaw[]
  footerRoutes: RouteRecordRaw[]
  selectedKeys: string[]
  openKeys: string[]
}>()

const emit = defineEmits<{
  menuItemClick: [key: string]
  subMenuClick: [key: string]
  versionTap: []
}>()

// Sub-menu children must pass the same tier + permission gates as top-level
// routes (hideInMenu + isVisible). Used for groups like "ops" whose children
// have differing tiers, e.g. request-debug (Pro+) vs request-logs (all tiers).
function visibleChildren(route: RouteRecordRaw): RouteRecordRaw[] {
  return (route.children || []).filter((c) => !c.meta?.hideInMenu && isVisible(c))
}
</script>

<style scoped lang="less">
.layout-sider {
  flex-shrink: 0;
  width: 240px;
  height: 100vh;
  background: var(--color-bg-2);
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
  padding: 8px 12px;
  border-top: 1px solid var(--color-fill-2);
}

.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.footer-action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  padding: 0 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;

  &:hover {
    background-color: var(--color-fill-2);
  }

  &.active {
    background-color: rgb(var(--arcoblue-1));
    color: rgb(var(--arcoblue-6));

    .footer-action-icon {
      color: rgb(var(--arcoblue-6));
    }
  }
}

.footer-action-icon {
  font-size: 16px;
  flex-shrink: 0;
  color: var(--color-text-2);
}

.footer-action-label {
  font-size: 13px;
  color: var(--color-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-text {
  display: block;
  text-align: center;
  font-size: 11px;
  color: var(--color-text-4);
  cursor: default;
  user-select: none;
  padding-top: 4px;
}
</style>

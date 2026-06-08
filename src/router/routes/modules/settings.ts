import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'settings',
  name: 'settings',
  component: () => import('@/views/settings/index.vue'),
  meta: { menuKey: 'settings', icon: 'icon-settings', order: 6, sidebarFooter: true },
}

export default route

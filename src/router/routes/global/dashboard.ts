import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'overview',
  name: 'globalDashboard',
  component: () => import('@/views/global/dashboard/index.vue'),
  meta: {
    menuKey: 'globalDashboard',
    icon: 'icon-dashboard',
    order: 0,
    requiresPlatformAdmin: true,
    requiredTier: 'enterprise',
  },
}

export default route

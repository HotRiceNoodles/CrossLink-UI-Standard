import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'dashboard',
  name: 'dashboard',
  component: () => import('@/views/dashboard/index.vue'),
  meta: {
    menuKey: 'dashboard',
    icon: 'icon-dashboard',
    order: 0,
    requiredPermission: 'usage:stats',
  },
}

export default route

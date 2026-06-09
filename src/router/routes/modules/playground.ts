import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'playground',
  name: 'playground',
  component: () => import('@/views/playground/index.vue'),
  meta: {
    menuKey: 'playground',
    icon: 'icon-code',
    order: 8,
    requiredTier: ['pro', 'enterprise'],
    requiredPermission: 'playground:use',
  },
}

export default route

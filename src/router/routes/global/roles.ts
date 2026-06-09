import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'roles',
  name: 'globalRoles',
  component: () => import('@/views/auth/roles/index.vue'),
  meta: {
    menuKey: 'globalRoles',
    icon: 'icon-user-group',
    order: 2,
    requiresPlatformAdmin: true,
    requiredTier: 'enterprise',
  },
}

export default route

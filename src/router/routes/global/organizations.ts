import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'organizations',
  name: 'globalOrganizations',
  component: () => import('@/views/auth/organizations/index.vue'),
  meta: { menuKey: 'globalOrganizations', icon: 'icon-public', order: 1 },
}

export default route

import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'pats',
  name: 'pats',
  component: () => import('@/views/pat/index.vue'),
  meta: {
    menuKey: 'pats',
    icon: 'icon-idcard',
    order: 9,
    sidebarFooter: true,
    requiredPermission: 'pat:manage',
  },
}

export default route

import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'license',
  name: 'license',
  component: () => import('@/views/license/index.vue'),
  meta: {
    menuKey: 'license',
    icon: 'icon-safe',
    order: 7,
    sidebarFooter: true,
  },
}

export default route

import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'key',
  name: 'key',
  component: () => import('@/views/key/index.vue'),
  meta: {
    menuKey: 'key',
    icon: 'icon-lock',
    order: 3,
    requiredPermission: 'key:list',
  },
}

export default route

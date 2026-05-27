import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'provider',
  name: 'provider',
  component: () => import('@/views/provider/index.vue'),
  meta: {
    menuKey: 'provider',
    icon: 'icon-storage',
    order: 1,
  },
}

export default route

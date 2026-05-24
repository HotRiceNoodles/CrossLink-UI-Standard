import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'provider',
  name: 'provider',
  component: () => import('@/views/provider/index.vue'),
  meta: {
    locale: '供应商管理',
    icon: 'icon-storage',
    order: 1,
  },
}

export default route

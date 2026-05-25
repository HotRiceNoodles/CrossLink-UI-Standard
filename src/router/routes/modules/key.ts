import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'key',
  name: 'key',
  component: () => import('@/views/key/index.vue'),
  meta: {
    locale: 'API 密钥',
    menuKey: 'key',
    icon: 'icon-lock',
    order: 3,
  },
}

export default route

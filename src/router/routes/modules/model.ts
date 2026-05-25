import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'model',
  name: 'model',
  component: () => import('@/views/model/index.vue'),
  meta: {
    locale: '模型管理',
    menuKey: 'model',
    icon: 'icon-mind-mapping',
    order: 2,
  },
}

export default route

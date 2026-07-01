import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'model',
  name: 'model',
  component: () => import('@/views/model/index.vue'),
  meta: {
    menuKey: 'model',
    icon: 'icon-mind-mapping',
    order: 2,
    requiredPermission: 'model:list',
  },
}

export default route

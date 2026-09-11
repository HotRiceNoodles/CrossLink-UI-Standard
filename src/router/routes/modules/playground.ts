import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'playground',
  name: 'playground',
  component: () => import('@/views/playground/index.vue'),
  meta: {
    menuKey: 'playground',
    icon: 'icon-code',
    order: 9,
    // 不设 requiredTier —— community 即可用（playground:use 已下沉至社区基础集）
    requiredPermission: 'playground:use',
  },
}

export default route

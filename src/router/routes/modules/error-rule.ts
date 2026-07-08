import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'error-rules',
  name: 'errorRules',
  component: () => import('@/views/error-rule/index.vue'),
  meta: {
    menuKey: 'errorRules',
    icon: 'icon-filter',
    order: 9,
    requiredPermission: 'error_rule:list',
  },
}

export default route

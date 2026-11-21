import type { RouteRecordRaw } from 'vue-router'

// 行为基线防护台账（Pro）：异常裁决 / 指纹复核 / 覆盖率，observe-only
const route: RouteRecordRaw = {
  path: 'behavior',
  name: 'behavior',
  component: () => import('@/views/behavior/index.vue'),
  meta: {
    menuKey: 'behavior',
    icon: 'icon-fire',
    order: 6.5,
    requiredPermission: 'behavior:view',
    requiredTier: ['pro', 'enterprise'],
  },
}

export default route

import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'ops',
  name: 'ops',
  redirect: '/ops/request-logs',
  component: () => import('@/layout/blank-layout.vue'),
  meta: { menuKey: 'ops', icon: 'icon-tool', order: 5, isMenuGroup: true },
  children: [
    {
      path: 'request-logs',
      name: 'requestLogs',
      component: () => import('@/views/ops/request-logs/index.vue'),
      meta: { menuKey: 'requestLogs', icon: 'icon-file', requiredPermission: 'usage:list' },
    },
    {
      path: 'usage-statistics',
      name: 'usageStatistics',
      component: () => import('@/views/ops/usage-statistics/index.vue'),
      meta: {
        menuKey: 'usageStatistics',
        icon: 'icon-bar-chart',
        requiredPermission: 'usage:stats',
      },
    },
    {
      path: 'request-debug',
      name: 'requestDebug',
      component: () => import('@/views/ops/request-debug/index.vue'),
      meta: {
        menuKey: 'requestDebug',
        icon: 'icon-bug',
        requiredPermission: 'debug:list',
        requiredTier: ['pro', 'enterprise'],
      },
    },
    {
      path: 'request-debug/:seq',
      name: 'requestDebugDetail',
      component: () => import('@/views/ops/request-debug/detail.vue'),
      meta: {
        requiredPermission: 'debug:list',
        requiredTier: ['pro', 'enterprise'],
        hideInMenu: true,
      },
    },
  ],
}

export default route

import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'content-safety',
  name: 'contentSafety',
  redirect: '/content-safety/rules',
  component: () => import('@/layout/blank-layout.vue'),
  meta: {
    menuKey: 'contentSafety',
    icon: 'icon-exclamation-circle',
    order: 6,
    isMenuGroup: true,
    requiredPermission: 'guardrail:list',
    requiredTier: ['pro', 'enterprise'],
  },
  children: [
    {
      path: 'rules',
      name: 'safetyRules',
      component: () => import('@/views/safety/rules/index.vue'),
      meta: { menuKey: 'safetyRules', icon: 'icon-list', requiredPermission: 'guardrail:list' },
    },
    {
      path: 'alerts',
      name: 'safetyAlerts',
      component: () => import('@/views/safety/alerts/index.vue'),
      meta: {
        menuKey: 'safetyAlerts',
        icon: 'icon-notification',
        requiredPermission: 'guardrail_alert:logs',
      },
    },
  ],
}

export default route

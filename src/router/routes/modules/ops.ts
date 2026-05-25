import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'ops',
  name: 'ops',
  redirect: '/ops/request-logs',
  component: () => import('@/layout/blank-layout.vue'),
  meta: { locale: '运维', menuKey: 'ops', icon: 'icon-tool', order: 5, isMenuGroup: true },
  children: [
    {
      path: 'request-logs',
      name: 'requestLogs',
      component: () => import('@/views/ops/request-logs/index.vue'),
      meta: { locale: '请求日志', menuKey: 'requestLogs', icon: 'icon-file' },
    },
  ],
}

export default route

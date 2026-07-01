import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'auth',
  name: 'auth',
  redirect: { name: 'authMembers' },
  component: () => import('@/layout/blank-layout.vue'),
  meta: {
    menuKey: 'authMembers',
    icon: 'icon-user-group',
    order: 4,
    requiredTier: 'enterprise',
  },
  children: [
    {
      path: '',
      name: 'authMembers',
      component: () => import('@/views/auth/members/index.vue'),
      meta: { requiredPermission: 'user:list' },
    },
    // 旧路由重定向
    { path: 'users', redirect: { name: 'authMembers' } },
    { path: 'teams', redirect: { name: 'authMembers' } },
  ],
}

export default route

import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'auth',
  name: 'auth',
  redirect: { name: 'authRoles' },
  component: () => import('@/layout/blank-layout.vue'),
  meta: {
    menuKey: 'auth',
    icon: 'icon-safe',
    order: 4,
    isMenuGroup: true,
    requiredTier: 'enterprise',
  },
  children: [
    {
      path: 'roles',
      name: 'authRoles',
      component: () => import('@/views/auth/roles/index.vue'),
      meta: { menuKey: 'authRoles', icon: 'icon-user-group' },
    },
    {
      path: 'users',
      name: 'authUsers',
      component: () => import('@/views/auth/users/index.vue'),
      meta: { menuKey: 'authUsers', icon: 'icon-user' },
    },
    {
      path: 'teams',
      name: 'authTeams',
      component: () => import('@/views/auth/teams/index.vue'),
      meta: { menuKey: 'authTeams', icon: 'icon-nav' },
    },
  ],
}

export default route

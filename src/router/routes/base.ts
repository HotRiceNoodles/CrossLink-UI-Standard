import type { RouteRecordRaw } from 'vue-router'

export const DEFAULT_LAYOUT = () => import('@/layout/default-layout.vue')

export const REDIRECT_MAIN: RouteRecordRaw = {
  path: '/redirect',
  name: 'redirect',
  children: [
    {
      path: '/redirect/:path(.*)',
      component: () => import('@/views/redirect/index.vue'),
    },
  ],
}

export const NOT_FOUND_ROUTE: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'notFound',
  component: () => import('@/views/not-found/index.vue'),
}

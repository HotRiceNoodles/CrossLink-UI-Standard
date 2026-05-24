import type { RouteRecordRaw } from 'vue-router'
import { DEFAULT_LAYOUT } from './base'

const pageModules = import.meta.glob<RouteRecordRaw>('./modules/*.ts', { eager: true })

const children: RouteRecordRaw[] = []
Object.values(pageModules).forEach((module) => {
  const route = module.default || module
  if (route) {
    children.push(route as RouteRecordRaw)
  }
})

children.sort((a, b) => {
  const orderA = (a.meta as { order?: number })?.order ?? 999
  const orderB = (b.meta as { order?: number })?.order ?? 999
  return orderA - orderB
})

const appRoute: RouteRecordRaw = {
  path: '/',
  name: 'root',
  component: DEFAULT_LAYOUT,
  meta: { requiresAuth: true },
  children,
}

export default appRoute

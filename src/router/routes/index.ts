import type { RouteRecordRaw } from 'vue-router'
import { DEFAULT_LAYOUT } from './base'

const orgModules = import.meta.glob<RouteRecordRaw>('./modules/*.ts', { eager: true })
const globalModules = import.meta.glob<RouteRecordRaw>('./global/*.ts', { eager: true })

function buildChildren(modules: Record<string, RouteRecordRaw>): RouteRecordRaw[] {
  const children: RouteRecordRaw[] = []
  Object.values(modules).forEach((module) => {
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
  return children
}

// Global routes — platform admin only, no org context
const globalRoute: RouteRecordRaw = {
  path: '/',
  name: 'global',
  component: DEFAULT_LAYOUT,
  meta: { requiresAuth: true, requiresPlatformAdmin: true },
  children: buildChildren(globalModules),
}

// Org-scoped routes — require org context
const orgRoute: RouteRecordRaw = {
  path: '/org/:orgId',
  name: 'orgRoot',
  component: DEFAULT_LAYOUT,
  meta: { requiresAuth: true, requiresOrg: true },
  children: buildChildren(orgModules),
}

export default [globalRoute, orgRoute]

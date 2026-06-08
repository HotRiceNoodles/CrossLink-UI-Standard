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

/**
 * Recursively prefix all route names in a route config.
 * Used to avoid Vue Router name conflicts between default and org routes.
 */
function prefixRouteNames(route: RouteRecordRaw, prefix: string): RouteRecordRaw {
  return {
    ...route,
    name: route.name ? `${prefix}${String(route.name)}` : route.name,
    children: route.children?.map((child) => prefixRouteNames(child, prefix)),
  }
}

/**
 * Clone module routes with prefixed names for org-scoped routes.
 */
function buildOrgChildren(modules: Record<string, RouteRecordRaw>): RouteRecordRaw[] {
  const children: RouteRecordRaw[] = []
  Object.values(modules).forEach((module) => {
    const route = module.default || module
    if (route) {
      children.push(prefixRouteNames(route as RouteRecordRaw, 'org-'))
    }
  })
  children.sort((a, b) => {
    const orderA = (a.meta as { order?: number })?.order ?? 999
    const orderB = (b.meta as { order?: number })?.order ?? 999
    return orderA - orderB
  })
  return children
}

// Default route — serves all tiers:
//   - Community/Pro: feature modules (dashboard, provider, model, key, ops, settings)
//   - Enterprise admin: admin modules (overview, organizations)
//   - Feature modules with requiresPlatformAdmin meta are filtered by guards & menu
const defaultRoute: RouteRecordRaw = {
  path: '/',
  name: 'default',
  component: DEFAULT_LAYOUT,
  meta: { requiresAuth: true },
  children: [...buildChildren(orgModules), ...buildChildren(globalModules)],
}

// Org-scoped route — enterprise edition only
// Children have org- prefixed names to avoid conflicts with default route
const orgRoute: RouteRecordRaw = {
  path: '/org/:orgId',
  name: 'orgRoot',
  component: DEFAULT_LAYOUT,
  meta: { requiresAuth: true, requiresOrg: true, requiredTier: 'enterprise' },
  children: buildOrgChildren(orgModules),
}

export default [defaultRoute, orgRoute]

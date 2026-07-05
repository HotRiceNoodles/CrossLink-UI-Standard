import type { Router } from 'vue-router'
import { isLogin } from '@/utils/auth'
import { useUserStore } from '@/store'
import { authApi } from '@/api/auth'
import { orgApi } from '@/api/rbac'

const WHITE_LIST = [{ name: 'login' }, { name: 'home' }]

function safeRedirect(redirect: string | undefined): string | undefined {
  if (!redirect) return undefined
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined
}

let permissionPromise: Promise<void> | null = null

function createLoginGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    if (isLogin()) {
      // Logged-in users hitting /login are forwarded to the app shell.
      // The tier/org guards resolve '/' to the right dashboard.
      if (to.name === 'login') {
        next({ path: '/' })
        return
      }
      const userStore = useUserStore()
      if (userStore.hydrated) {
        next()
      } else {
        try {
          if (!permissionPromise) {
            permissionPromise = (async () => {
              const res = await authApi.permissions()
              userStore.setPermissions(res.data.permissions)
              userStore.setTier(res.data.tier)
              userStore.initOrgContext()
              userStore.markHydrated()

              // Only fetch org list for enterprise platform admins
              if (userStore.isEnterprise && userStore.isPlatformAdmin) {
                const orgsRes = await orgApi.list()
                userStore.setAvailableOrgs(orgsRes.data)
              }
            })()
          }
          await permissionPromise
          next()
        } catch {
          userStore.logout()
          next({ name: 'login', query: { redirect: safeRedirect(to.fullPath) || to.fullPath } })
        } finally {
          permissionPromise = null
        }
      }
    } else if (WHITE_LIST.some((item) => item.name === to.name)) {
      next()
    } else {
      next({ name: 'home', query: { redirect: safeRedirect(to.fullPath) || to.fullPath } })
    }
  })
}

function createTierGuard(router: Router) {
  router.beforeEach((to) => {
    const match = to.matched.find((m) => m.meta?.requiredTier)
    if (!match) return true
    const requiredTier = match.meta.requiredTier
    const userStore = useUserStore()
    const allowed = Array.isArray(requiredTier)
      ? requiredTier.includes(userStore.tier)
      : userStore.tier === requiredTier
    if (!allowed) return { name: 'notFound' }
    return true
  })
}

function createOrgGuard(router: Router) {
  router.beforeEach((to) => {
    const userStore = useUserStore()
    const isDefaultRoute = to.matched.some((m) => m.name === 'default')
    const isOrgRoute = to.matched.some((m) => m.name === 'orgRoot')

    // Dynamic root redirect based on tier and role
    if (to.path === '/' || to.path === '') {
      if (userStore.isEnterprise && userStore.isPlatformAdmin) {
        return { name: 'globalDashboard' }
      }
      if (userStore.isEnterprise && userStore.currentOrgId) {
        return `/org/${userStore.currentOrgId}/dashboard`
      }
      // Community/Pro: go to default dashboard
      return { name: 'dashboard' }
    }

    // Org-scoped routes: only accessible in enterprise edition
    if (isOrgRoute) {
      if (!userStore.isEnterprise) {
        // Non-enterprise users should not access org routes
        return { name: 'dashboard' }
      }
      if (!userStore.hasOrgContext) {
        return userStore.isPlatformAdmin ? { name: 'globalDashboard' } : { name: 'login' }
      }
      const routeOrgId = Number(to.params.orgId)
      if (!userStore.isPlatformAdmin && routeOrgId !== userStore.currentOrgId) {
        return `/org/${userStore.currentOrgId}/dashboard`
      }
      if (userStore.isPlatformAdmin && routeOrgId !== userStore.currentOrgId) {
        return { name: 'globalDashboard' }
      }
    }

    // Admin-only routes on default route: must be enterprise platform admin
    if (isDefaultRoute && to.matched.some((m) => m.meta?.requiresPlatformAdmin)) {
      if (!userStore.isEnterprise || !userStore.isPlatformAdmin) {
        return { name: 'notFound' }
      }
    }

    return true
  })
}

function createPermissionGuard(router: Router) {
  router.beforeEach((to) => {
    const requiredPermission = to.meta?.requiredPermission as string | undefined
    if (!requiredPermission) return true
    const userStore = useUserStore()
    if (!userStore.hasPermission(requiredPermission)) {
      return { name: 'notFound' }
    }
    return true
  })
}

export default function createRouteGuard(router: Router) {
  createLoginGuard(router)
  createTierGuard(router)
  createOrgGuard(router)
  createPermissionGuard(router)
}

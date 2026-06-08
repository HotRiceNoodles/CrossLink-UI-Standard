import type { Router } from 'vue-router'
import { isLogin } from '@/utils/auth'
import { useUserStore } from '@/store'
import { authApi } from '@/api/auth'
import { orgApi } from '@/api/rbac'

const WHITE_LIST = [{ name: 'login' }]

function safeRedirect(redirect: string | undefined): string | undefined {
  if (!redirect) return undefined
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined
}

let permissionPromise: Promise<void> | null = null

function createLoginGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    if (isLogin()) {
      const userStore = useUserStore()
      if (userStore.user) {
        next()
      } else {
        try {
          if (!permissionPromise) {
            permissionPromise = (async () => {
              const res = await authApi.permissions()
              userStore.setPermissions(res.data.permissions)
              userStore.setTier(res.data.tier)
              userStore.initOrgContext()

              if (userStore.isPlatformAdmin) {
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
      next({ name: 'login', query: { redirect: safeRedirect(to.fullPath) || to.fullPath } })
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

    // Dynamic root redirect based on role
    if (to.path === '/' || to.path === '') {
      if (userStore.isPlatformAdmin) return { name: 'globalDashboard' }
      if (userStore.currentOrgId) return `/org/${userStore.currentOrgId}/dashboard`
      return { name: 'login' }
    }

    // Org-scoped routes: must have org context
    if (to.matched.some((m) => m.meta?.requiresOrg)) {
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

    // Global-only routes: must be platform admin
    if (to.matched.some((m) => m.meta?.requiresPlatformAdmin)) {
      if (!userStore.isPlatformAdmin) {
        return userStore.currentOrgId
          ? `/org/${userStore.currentOrgId}/dashboard`
          : { name: 'notFound' }
      }
    }

    return true
  })
}

export default function createRouteGuard(router: Router) {
  createLoginGuard(router)
  createTierGuard(router)
  createOrgGuard(router)
}

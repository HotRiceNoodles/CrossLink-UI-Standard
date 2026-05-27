import type { Router } from 'vue-router'
import { isLogin } from '@/utils/auth'
import { useUserStore } from '@/store'
import { authApi } from '@/api/auth'

const WHITE_LIST = [{ name: 'login' }]

function safeRedirect(redirect: string | undefined): string | undefined {
  if (!redirect) return undefined
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined
}

function createLoginGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    if (isLogin()) {
      const userStore = useUserStore()
      if (userStore.user) {
        next()
      } else {
        try {
          const res = await authApi.permissions()
          userStore.setPermissions(res.data.permissions)
          userStore.setTier(res.data.tier)
          next()
        } catch {
          userStore.logout()
          next({ name: 'login', query: { redirect: to.fullPath } })
        }
      }
    } else if (WHITE_LIST.some((item) => item.name === to.name)) {
      next()
    } else {
      next({ name: 'login', query: { redirect: safeRedirect(to.fullPath) || to.fullPath } })
    }
  })
}

export default function createRouteGuard(router: Router) {
  createLoginGuard(router)
}

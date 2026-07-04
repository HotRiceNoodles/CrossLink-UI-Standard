import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store'

/**
 * Centralized sidebar/menu visibility gate. A route is shown only when BOTH its
 * tier gate (`meta.requiredTier`) and permission gate (`meta.requiredPermission`)
 * admit the current user. Used for top-level routes in default-layout and for
 * sub-menu children in sidebar, so e.g. a Pro-only item never appears for
 * Community users even when it sits inside an always-visible group like "ops".
 */
export function useMenuVisibility() {
  const userStore = useUserStore()

  function isVisible(route: RouteRecordRaw): boolean {
    const requiredTier = route.meta?.requiredTier
    if (requiredTier) {
      const allowed = Array.isArray(requiredTier)
        ? requiredTier.includes(userStore.tier)
        : userStore.tier === requiredTier
      if (!allowed) return false
    }

    const requiredPermission = route.meta?.requiredPermission as string | undefined
    if (requiredPermission && !userStore.hasPermission(requiredPermission)) return false

    return true
  }

  return { isVisible }
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { setToken, clearToken, getToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const tier = ref('community')

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role_name === 'admin')

  function setAuth(data: { token: string; user: User; permissions: string[]; tier: string }) {
    token.value = data.token
    user.value = data.user
    permissions.value = data.permissions
    tier.value = data.tier
    setToken(data.token)
  }

  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  function setTier(t: string) {
    tier.value = t
  }

  function logout() {
    token.value = ''
    user.value = null
    permissions.value = []
    tier.value = 'community'
    clearToken()
  }

  function hasPermission(action: string): boolean {
    if (isAdmin.value) return true
    return permissions.value.includes(action)
  }

  return {
    token,
    user,
    permissions,
    tier,
    isLoggedIn,
    isAdmin,
    setAuth,
    setPermissions,
    setTier,
    logout,
    hasPermission,
  }
})

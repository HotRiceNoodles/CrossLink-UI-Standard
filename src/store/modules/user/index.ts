import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, OrgContext, Organization } from '@/types'
import { setToken, clearToken, getToken } from '@/utils/auth'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const tier = ref('community')

  // Org context state
  const currentOrg = ref<OrgContext | null>(null)
  const availableOrgs = ref<Organization[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role_name === 'admin')
  const isPlatformAdmin = computed(() => user.value?.role_name === 'admin')
  const hasOrgContext = computed(() => !!currentOrg.value)
  const currentOrgId = computed(() => currentOrg.value?.orgId ?? null)

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

  function setUser(u: User) {
    user.value = u
  }

  function initOrgContext() {
    // Derive org context from the user object.
    // For org users: user.org_id is set from JWT claims via the permissions API.
    // For platform admins who switched into an org: user.org_id reflects the switched org.
    // For platform admins in platform scope: user.org_id is 0 or null.
    if (user.value?.org_id && user.value.org_id > 0) {
      currentOrg.value = {
        orgId: user.value.org_id,
        orgName: user.value.org_name ?? '',
        orgRole: user.value.org_role ?? '',
      }
    } else {
      currentOrg.value = null
    }
  }

  async function switchOrg(targetOrgId: number) {
    const res = await authApi.switchOrg({ org_id: targetOrgId })
    setToken(res.data.token)
    token.value = res.data.token
    if (res.data.org_id > 0) {
      currentOrg.value = {
        orgId: res.data.org_id,
        orgName: res.data.org_display_name || res.data.org_name,
        orgRole: user.value?.org_role ?? 'admin',
      }
    } else {
      currentOrg.value = null
    }
  }

  function clearOrgContext() {
    currentOrg.value = null
  }

  function setAvailableOrgs(orgs: Organization[]) {
    availableOrgs.value = orgs
  }

  function logout() {
    token.value = ''
    user.value = null
    permissions.value = []
    tier.value = 'community'
    currentOrg.value = null
    availableOrgs.value = []
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
    currentOrg,
    availableOrgs,
    isLoggedIn,
    isAdmin,
    isPlatformAdmin,
    hasOrgContext,
    currentOrgId,
    setAuth,
    setUser,
    setPermissions,
    setTier,
    initOrgContext,
    switchOrg,
    clearOrgContext,
    setAvailableOrgs,
    logout,
    hasPermission,
  }
})

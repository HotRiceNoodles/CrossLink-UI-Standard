import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, OrgContext, Organization } from '@/types'
import { setToken, clearToken, getToken } from '@/utils/auth'
import { authApi } from '@/api/auth'

const ORG_STORAGE_KEY = 'lgw_current_org'

function loadPersistedOrg(): OrgContext | null {
  try {
    const raw = localStorage.getItem(ORG_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as OrgContext
  } catch {
    // ignore
  }
  return null
}

function persistOrg(org: OrgContext | null) {
  if (org) {
    localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(org))
  } else {
    localStorage.removeItem(ORG_STORAGE_KEY)
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const tier = ref('community')

  // Org context state
  const currentOrg = ref<OrgContext | null>(loadPersistedOrg())
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

  function initOrgContext() {
    if (user.value?.org_id && user.value.org_id > 0) {
      currentOrg.value = {
        orgId: user.value.org_id,
        orgName: user.value.org_name ?? '',
        orgRole: user.value.org_role ?? '',
      }
    } else if (isPlatformAdmin.value && currentOrg.value) {
      // Platform admin who previously switched into an org — keep persisted context
    } else {
      currentOrg.value = null
    }
    persistOrg(currentOrg.value)
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
    persistOrg(currentOrg.value)
  }

  function clearOrgContext() {
    currentOrg.value = null
    persistOrg(null)
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
    persistOrg(null)
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

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, OrgContext, Organization } from '@/types'
import { setToken, clearToken, getToken } from '@/utils/auth'
import { authApi } from '@/api/auth'

const ORG_STORAGE_KEY = 'lgw_current_org'
const SESSION_STORAGE_KEY = 'lgw_session'

interface PersistedSession {
  user: User
  tier: string
  permissions: string[]
}

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

function loadPersistedSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistedSession
  } catch {
    // ignore
  }
  return null
}

function persistSession(session: PersistedSession | null) {
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())

  // Restore full session from localStorage
  const persisted = loadPersistedSession()
  const user = ref<User | null>(persisted?.user ?? null)
  const permissions = ref<string[]>(persisted?.permissions ?? [])
  const tier = ref(persisted?.tier ?? 'community')
  // hydrated = true only when session was explicitly set via setAuth (login or API rehydration)
  // Prevents guard from skipping the permissions API call on initial page load with stale data
  const hydrated = ref(false)

  // Org context state
  const currentOrg = ref<OrgContext | null>(loadPersistedOrg())
  const availableOrgs = ref<Organization[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role_name === 'admin')
  const isPlatformAdmin = computed(() => user.value?.role_name === 'admin')
  const isEnterprise = computed(() => tier.value === 'enterprise')
  const hasOrgContext = computed(() => !!currentOrg.value)
  const currentOrgId = computed(() => currentOrg.value?.orgId ?? null)

  function setAuth(data: { token: string; user: User; permissions: string[]; tier: string }) {
    token.value = data.token
    user.value = data.user
    permissions.value = data.permissions
    tier.value = data.tier
    hydrated.value = true
    setToken(data.token)
    persistSession({ user: data.user, tier: data.tier, permissions: data.permissions })
  }

  function setUser(u: User) {
    user.value = u
  }

  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  function setTier(t: string) {
    tier.value = t
  }

  function markHydrated() {
    hydrated.value = true
    if (user.value) {
      persistSession({ user: user.value, tier: tier.value, permissions: permissions.value })
    }
  }

  function initOrgContext() {
    if (user.value?.org_id && user.value.org_id > 0) {
      currentOrg.value = {
        orgId: user.value.org_id,
        orgName: user.value.org_name ?? '',
        orgRole: user.value.org_role ?? '',
      }
    } else if (isPlatformAdmin.value && isEnterprise.value && currentOrg.value) {
      // Enterprise platform admin who previously switched into an org — keep persisted context
    } else if (!user.value && currentOrg.value) {
      // During page-refresh rehydration, user is temporarily null.
      // Preserve the org context loaded from localStorage so guards
      // don't redirect to login before the user object is populated.
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
    hydrated.value = false
    currentOrg.value = null
    availableOrgs.value = []
    clearToken()
    persistOrg(null)
    persistSession(null)
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
    hydrated,
    currentOrg,
    availableOrgs,
    isLoggedIn,
    isAdmin,
    isPlatformAdmin,
    isEnterprise,
    hasOrgContext,
    currentOrgId,
    setAuth,
    setUser,
    setPermissions,
    setTier,
    markHydrated,
    initOrgContext,
    switchOrg,
    clearOrgContext,
    setAvailableOrgs,
    logout,
    hasPermission,
  }
})

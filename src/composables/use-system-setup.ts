// First-run system setup wizard (timezone / base_url / encryption key).
// Distinct from the provider onboarding wizard: this one is driven by the
// backend setup_needed flag (login/permissions responses) and persists via
// POST /system/setup/{apply,skip}.
import { setupApi } from '@/api/setup'
import { useUserStore } from '@/store'

export const SETUP_REOPEN_EVENT = 'reopen-system-setup'
// localStorage dismissal so a hard reload doesn't re-popup within the session
// after the user closed the wizard without completing it.
export const SETUP_DISMISSED_KEY = 'system_setup_dismissed'

export function useSystemSetup() {
  const userStore = useUserStore()

  function isDismissed(): boolean {
    return localStorage.getItem(SETUP_DISMISSED_KEY) === '1'
  }

  function markDismissed() {
    localStorage.setItem(SETUP_DISMISSED_KEY, '1')
  }

  function clearDismissed() {
    localStorage.removeItem(SETUP_DISMISSED_KEY)
  }

  /** Auto-popup condition: backend flag set, user can act on it, not dismissed. */
  function shouldAutoShow(): boolean {
    if (!userStore.setupNeeded) return false
    if (!userStore.hasPermission('system:update')) return false
    return !isDismissed()
  }

  async function skip(): Promise<void> {
    await setupApi.skip()
    markDismissed()
    userStore.setSetupNeeded(false)
  }

  async function apply(payload: Parameters<typeof setupApi.apply>[0]) {
    const res = await setupApi.apply(payload)
    clearDismissed()
    userStore.setSetupNeeded(false)
    return res.data
  }

  return {
    shouldAutoShow,
    markDismissed,
    skip,
    apply,
  }
}

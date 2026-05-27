const PERSIST_KEY = 'crosslink-app-settings'

export function loadPersistedSettings(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function persistSettings(settings: Record<string, unknown>): void {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(settings))
  } catch {
    // ignore storage errors
  }
}

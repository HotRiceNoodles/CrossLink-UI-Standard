import zhCN from '../zh-CN'
import enUS from '../en-US'
import arEG from '../ar-EG'

/**
 * Pins the DYNAMIC i18n key families — template-literal t() calls whose key is
 * built from a runtime value (record fields, enums). The interpolation test
 * only checks statically quotable keys, and the parity test only guarantees the
 * three locales match EACH OTHER — a variant missing from all three at once
 * (new enum value shipped without locale keys) slips through both and renders
 * as the raw key path at runtime.
 *
 * When the backend adds an enum value to one of these families: add the variant
 * here AND to all three locale files.
 */
const FAMILIES: Record<string, string[]> = {
  // guardrail rule versioning / stream capability / enums
  'safety.rules.changeKind': ['create', 'update', 'delete', 'rollback', 'migrate'],
  'safety.rules.streamStrategy': ['safe_prefix', 'response_complete', 'request_only'],
  'safety.action': ['block', 'log', 'mask'],
  'safety.direction': ['request', 'response', 'both', 'ingress', 'egress'],
  'safety.severity': ['low', 'medium', 'high', 'warning', 'critical'],
  'safety.engineType': [
    'keyword_filter',
    'pii_detection',
    'prompt_injection',
    'credential_detection',
    'openai_moderation',
    'content_length',
    'agent_fingerprint',
    'behavior_analysis',
    'webhook',
    'ip_binding',
  ],
  'safety.alertStatus': ['logged', 'sent', 'partial', 'failed', 'dropped', 'blocked'],
  // behavior ledger (backend behavior ledger.go constants)
  behavior: [], // partial-key family below
  // SSRF allowlist effective source (service SsrfSource* constants)
  ssrf: [], // partial-key family below
  // error rules
  'errorRule.matchField': ['status', 'code', 'type', 'message'],
  'errorRule.scope': ['account', 'model'],
  // key import result statuses
  'key.import.status': ['created', 'duplicate', 'invalid', 'model_not_found', 'failed'],
  // dashboard weekday header
  'dashboard.weekDays': ['0', '1', '2', '3', '4', '5', '6'],
}

// Partial-key families: code builds keys as `<section>.<prefix><value>`, e.g.
// behavior.status_open — enumerate variants by scanning the section's keys.
const PARTIAL_FAMILIES: Record<string, string[]> = {
  behavior: ['status_', 'band_', 'fp_'],
  ssrf: ['source_'],
}

/** Union of variants a family must cover = pinned list + any extra keys
 *  already present in zh-CN (so backend additions fail loudly here first). */
function familyVariants(locale: unknown, dotted: string): string[] {
  let cur: unknown = locale
  for (const part of dotted.split('.')) {
    if (cur === null || typeof cur !== 'object') return []
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur && typeof cur === 'object' ? Object.keys(cur) : []
}

/** Resolve a dotted key path in a nested message object. */
function lookup(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const part of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

const LOCALES: [string, unknown][] = [
  ['zh-CN', zhCN],
  ['en-US', enUS],
  ['ar-EG', arEG],
]

describe('dynamic i18n key families (mirrors backend enums)', () => {
  for (const [name, locale] of LOCALES) {
    it(`${name} covers every pinned variant`, () => {
      const missing: string[] = []
      for (const [family, variants] of Object.entries(FAMILIES)) {
        if (!variants.length) continue
        for (const variant of variants) {
          const key = `${family}.${variant}`
          if (typeof lookup(locale, key) !== 'string') missing.push(key)
        }
      }
      expect(missing).toEqual([])
    })

    it(`${name} partial-key families are identical across locales`, () => {
      // Enumerate concrete variants from this locale, then require the same
      // set in the other two — covers both "missing somewhere" and drift.
      for (const [section, prefixes] of Object.entries(PARTIAL_FAMILIES)) {
        const node = lookup(locale, section)
        const keys =
          node && typeof node === 'object'
            ? Object.keys(node).filter((k) => prefixes.some((p) => k.startsWith(p)))
            : []
        expect(keys.length).toBeGreaterThan(0)
        for (const [otherName, other] of LOCALES) {
          if (otherName === name) continue
          const otherNode = lookup(other, section) as Record<string, unknown> | undefined
          const otherKeys = Object.keys(otherNode ?? {}).filter((k) =>
            prefixes.some((p) => k.startsWith(p)),
          )
          expect(otherKeys.sort()).toEqual([...keys].sort())
        }
      }
    })
  }

  it('zh-CN pins are the union — no unpinned extras hiding in locales', () => {
    // If a locale carries a variant beyond the pinned list, the pin is stale
    // (someone added a locale key for a new enum without updating this test).
    for (const [family, variants] of Object.entries(FAMILIES)) {
      if (!variants.length) continue
      const present = familyVariants(zhCN, family).sort()
      expect(present).toEqual([...variants].sort())
    }
  })
})

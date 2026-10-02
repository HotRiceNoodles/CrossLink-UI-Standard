import zhCN from '../zh-CN'
import enUS from '../en-US'
import arEG from '../ar-EG'

/**
 * Pins the doctor.check.* locale keys to the backend readiness checker
 * (llmGateway internal/admin/readiness.go). The backend sends i18n keys in
 * title_key / detail_key / fix_hint_key; a key missing from any locale
 * renders as the raw key string in the doctor tab. The parity test only
 * guarantees the three locales match each other — this test guarantees they
 * also cover the backend's check inventory.
 *
 * When the backend adds a check: add its id + variant keys here AND to all
 * three locale files.
 */
const CHECK_IDS = [
  'encryptionKey',
  'setupWizard',
  'providers',
  'apiKey',
  'timezone',
  'baseUrl',
  'smtp',
  'cors',
  'proxies',
  'contentLog',
  'bootGuards',
] as const

// Variants each check can emit (readiness.go DetailKey/FixHintKey values).
const VARIANTS: Record<(typeof CHECK_IDS)[number], string[]> = {
  encryptionKey: ['title', 'active', 'plaintextProviders', 'notConfigured', 'hint'],
  setupWizard: ['title', 'done', 'skipped', 'hint', 'notRun'],
  providers: ['title', 'none', 'hint', 'ok'],
  apiKey: ['title', 'none', 'hint', 'ok'],
  timezone: ['title', 'mismatch', 'hint', 'unset', 'ok'],
  baseUrl: ['title', 'unset', 'hint', 'ok'],
  smtp: ['title', 'ok', 'communityUnset', 'proUnset', 'hint'],
  cors: ['title', 'unset', 'hint', 'ok'],
  proxies: ['title', 'unset', 'hint', 'ok'],
  contentLog: ['title', 'enabled', 'hint', 'disabled'],
  bootGuards: ['title', 'ok'],
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

describe('doctor check locale coverage (mirrors backend readiness.go)', () => {
  for (const [name, locale] of LOCALES) {
    it(`${name} covers every check variant`, () => {
      const missing: string[] = []
      for (const id of CHECK_IDS) {
        for (const variant of VARIANTS[id]) {
          const key = `doctor.check.${id}.${variant}`
          if (typeof lookup(locale, key) !== 'string') missing.push(key)
        }
      }
      expect(missing).toEqual([])
    })
  }
})

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import enUS from '../en-US'

/**
 * Guards against interpolation-style mismatches between locale messages and
 * call sites: a message using a named placeholder ({name}) must be called
 * with a plain object (t(key, { name })), and a positional message ({0})
 * with an array (t(key, [v])). A mismatch renders the placeholder empty —
 * e.g. the 「」 in the provider delete confirm (fixed in cf96ebe).
 *
 * Only static string-literal keys are checked; dynamic keys (template
 * literals / variables) are invisible to the scanner and excluded.
 */

interface CallSite {
  file: string
  line: number
  key: string
  arg: 'list' | 'named'
}

/** Recursively walk src/, returning every .vue/.ts file path. */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === '__tests__' || name === 'locale') continue
      out.push(...walk(full))
    } else if (/\.(vue|ts)$/.test(name)) {
      out.push(full)
    }
  }
  return out
}

/** Flatten a nested message object into dotted key → message string. */
function flatten(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, path))
    } else if (typeof v === 'string') {
      out[path] = v
    }
  }
  return out
}

const messages = flatten(enUS)

function placeholderStyle(msg: string): 'list' | 'named' | 'none' {
  if (/\{\d+\}/.test(msg)) return 'list'
  if (/\{[a-zA-Z_][\w]*\}/.test(msg)) return 'named'
  return 'none'
}

// Scan sources for t('key', <array|object>) call sites with literal keys.
const callSites: CallSite[] = []
for (const file of walk(resolve(__dirname, '../..'))) {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    // matches t('key', [ ... or t('key', { ... (single/double quoted key)
    const re = /\bt\(\s*(['"])((?:(?!\1)[^\\])*)\1\s*,\s*(\[|\{)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(line))) {
      callSites.push({
        file: file.replace(/\\/g, '/').split('/src/')[1] ?? file,
        line: i + 1,
        key: m[2],
        arg: m[3] === '[' ? 'list' : 'named',
      })
    }
  })
}

describe('i18n interpolation arg style matches message placeholder style', () => {
  const unknownKeys = callSites.filter((c) => messages[c.key] === undefined)

  const mismatches = callSites
    .filter((c) => {
      const style = placeholderStyle(messages[c.key] ?? '')
      if (style === 'none') return false
      return style !== c.arg
    })
    .map((c) => `${c.file}:${c.line} t('${c.key}') passes ${c.arg} args`)

  it('has no interpolation-style mismatches', () => {
    expect(mismatches).toEqual([])
  })

  // Informational: literal keys that no longer exist in en-US (typos or
  // renamed keys render the key itself in the UI).
  it('references only existing keys', () => {
    expect(unknownKeys.map((c) => `${c.file}:${c.line} '${c.key}'`)).toEqual([])
  })
})

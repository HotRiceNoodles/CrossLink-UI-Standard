// Pure helpers for the prompt-templates module (no Vue / i18n dependency → unit-testable).
// Mirrors backend service/template_render.go rules so the front-end can validate
// and clean values without a round-trip.
import type { TemplateVariableDef } from '@/types'

// Matches backend varToken placeholder name class: [a-zA-Z_][a-zA-Z0-9_]*
export const VAR_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

// Matches backend reservedVarPattern (?i)user|input|query|prompt|message|text|content
export const RESERVED_NAME_RE = /user|input|query|prompt|message|text|content/i

export function isReservedName(name: string): boolean {
  return RESERVED_NAME_RE.test(name)
}

export function isValidVariableName(name: string): boolean {
  return VAR_NAME_RE.test(name)
}

/**
 * Clean a variable's default per its declared type before sending to the backend,
 * so it matches service.coerceVar (number→float64, bool→bool, else string).
 * Returns undefined when the default is absent/empty (let backend treat as missing).
 */
export function coerceDefault(v: TemplateVariableDef): unknown {
  if (v.default === undefined || v.default === null || v.default === '') return undefined
  if (v.type === 'number') return Number(v.default)
  if (v.type === 'bool') return Boolean(v.default)
  return String(v.default)
}

/**
 * Build the variables map for preview: drop empty values (let backend use
 * default/missing), coerce types so coerceVar doesn't throw type_mismatch.
 */
export function cleanPreviewValues(
  schema: TemplateVariableDef[],
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const v of schema) {
    const val = raw[v.name]
    if (val === undefined || val === null || val === '') continue
    if (v.type === 'number') out[v.name] = Number(val)
    else if (v.type === 'bool') out[v.name] = Boolean(val)
    else out[v.name] = String(val)
  }
  return out
}

/**
 * Preview error text shape from backend: "<code>: <detail>" (some codes carry
 * extra info, e.g. "system_too_large: rendered 9000 bytes > 8192"). Extract the
 * code as the substring before the first ':'.
 */
export function extractPreviewCode(text: string): string {
  if (!text) return ''
  const idx = text.indexOf(':')
  return idx > 0 ? text.slice(0, idx).trim() : text.trim()
}

/** Return the first duplicated variable name in the list, or null if unique. */
export function findDuplicateVariableName(rows: TemplateVariableDef[]): string | null {
  const seen = new Set<string>()
  for (const r of rows) {
    if (!r.name) continue
    if (seen.has(r.name)) return r.name
    seen.add(r.name)
  }
  return null
}

import { describe, it, expect } from 'vitest'
import type { TemplateVariableDef } from '@/types'
import {
  isReservedName,
  isValidVariableName,
  coerceDefault,
  cleanPreviewValues,
  extractPreviewCode,
  findDuplicateVariableName,
} from '../template-helpers'

describe('template-helpers', () => {
  describe('isReservedName', () => {
    it('matches backend reservedVarPattern (case-insensitive)', () => {
      expect(isReservedName('user')).toBe(true)
      expect(isReservedName('UserInput')).toBe(true)
      expect(isReservedName('user_query')).toBe(true)
      expect(isReservedName('prompt')).toBe(true)
      expect(isReservedName('message_text')).toBe(true)
      expect(isReservedName('content')).toBe(true)
    })
    it('passes non-reserved names', () => {
      expect(isReservedName('lang')).toBe(false)
      expect(isReservedName('max_words')).toBe(false)
      expect(isReservedName('tone')).toBe(false)
    })
  })

  describe('isValidVariableName', () => {
    it('matches backend varToken name class', () => {
      expect(isValidVariableName('lang')).toBe(true)
      expect(isValidVariableName('_foo')).toBe(true)
      expect(isValidVariableName('a1_b2')).toBe(true)
    })
    it('rejects invalid names', () => {
      expect(isValidVariableName('')).toBe(false)
      expect(isValidVariableName('1abc')).toBe(false)
      expect(isValidVariableName('has space')).toBe(false)
      expect(isValidVariableName('a:b')).toBe(false)
      expect(isValidVariableName('中文')).toBe(false)
    })
  })

  describe('coerceDefault', () => {
    const base = (over: Partial<TemplateVariableDef>): TemplateVariableDef => ({
      name: 'x',
      type: 'string',
      required: false,
      trusted: false,
      ...over,
    })

    it('returns undefined for empty/absent defaults', () => {
      expect(coerceDefault(base({ type: 'string', default: '' }))).toBeUndefined()
      expect(coerceDefault(base({ type: 'number', default: undefined }))).toBeUndefined()
      expect(coerceDefault(base({ type: 'bool', default: null as unknown }))).toBeUndefined()
    })
    it('coerces number → number', () => {
      expect(coerceDefault(base({ type: 'number', default: '123' }))).toBe(123)
      expect(coerceDefault(base({ type: 'number', default: 200 }))).toBe(200)
    })
    it('coerces bool → boolean', () => {
      expect(coerceDefault(base({ type: 'bool', default: 'true' }))).toBe(true)
      expect(coerceDefault(base({ type: 'bool', default: false }))).toBe(false)
    })
    it('coerces string/empty-type → string', () => {
      expect(coerceDefault(base({ type: 'string', default: 'zh' }))).toBe('zh')
      expect(coerceDefault(base({ type: '', default: 5 }))).toBe('5')
    })
  })

  describe('cleanPreviewValues', () => {
    it('drops empty values and coerces types to match backend coerceVar', () => {
      const schema: TemplateVariableDef[] = [
        { name: 'lang', type: 'string', required: true, trusted: true },
        { name: 'n', type: 'number', required: false, trusted: true },
        { name: 'flag', type: 'bool', required: false, trusted: true },
      ]
      const raw = { lang: 'zh', n: '', flag: 'true', extra: 'ignored' }
      expect(cleanPreviewValues(schema, raw)).toEqual({ lang: 'zh', flag: true })
    })
    it('produces a number (not string) for number type to avoid type_mismatch', () => {
      const schema: TemplateVariableDef[] = [
        { name: 'max', type: 'number', required: false, trusted: true },
      ]
      const out = cleanPreviewValues(schema, { max: '42' })
      expect(out.max).toBe(42)
      expect(typeof out.max).toBe('number')
    })
  })

  describe('extractPreviewCode', () => {
    it('takes substring before first colon as code', () => {
      expect(extractPreviewCode('missing_variable: lang')).toBe('missing_variable')
      expect(extractPreviewCode('untrusted_var_in_system: user_input')).toBe(
        'untrusted_var_in_system',
      )
      expect(extractPreviewCode('type_mismatch: n expected number')).toBe('type_mismatch')
    })
    it('handles codes whose message carries extra info', () => {
      expect(extractPreviewCode('system_too_large: rendered 9000 bytes > 8192')).toBe(
        'system_too_large',
      )
      expect(extractPreviewCode('value_too_large: big')).toBe('value_too_large')
    })
    it('handles multi-word codes (invalid variables_schema)', () => {
      expect(extractPreviewCode('invalid variables_schema: json error')).toBe(
        'invalid variables_schema',
      )
    })
    it('returns full trimmed text when no colon', () => {
      expect(extractPreviewCode('something')).toBe('something')
      expect(extractPreviewCode('')).toBe('')
    })
  })

  describe('findDuplicateVariableName', () => {
    it('returns the first duplicate name', () => {
      const rows: TemplateVariableDef[] = [
        { name: 'lang', type: 'string', required: false, trusted: true },
        { name: 'lang', type: 'string', required: false, trusted: true },
      ]
      expect(findDuplicateVariableName(rows)).toBe('lang')
    })
    it('returns null when all names unique or empty', () => {
      expect(
        findDuplicateVariableName([
          { name: 'a', type: 'string', required: false, trusted: true },
          { name: 'b', type: 'string', required: false, trusted: true },
        ]),
      ).toBeNull()
      expect(findDuplicateVariableName([])).toBeNull()
    })
    it('ignores empty names', () => {
      expect(
        findDuplicateVariableName([
          { name: '', type: 'string', required: false, trusted: false },
          { name: '', type: 'string', required: false, trusted: false },
        ]),
      ).toBeNull()
    })
  })
})

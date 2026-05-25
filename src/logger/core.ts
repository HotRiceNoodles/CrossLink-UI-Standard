// src/logger/core.ts
import type { LogLevel, LogSource, LogEntry } from './types'
import { RingBuffer } from './buffer'
import { formatConsole } from './formatters'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const SENSITIVE_KEYS = /token|password|secret|cookie|authorization|api[_-]?key/i
const MAX_DATA_DEPTH = 3
const MAX_STRING_LENGTH = 1024

function sanitize(value: unknown, depth: number = 0, seen: WeakSet<object> = new WeakSet()): unknown {
  if (depth > MAX_DATA_DEPTH) return '[MaxDepth]'
  if (value == null || typeof value !== 'object') {
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      return value.slice(0, MAX_STRING_LENGTH) + '...[truncated]'
    }
    return value
  }
  if (value instanceof Error) return value
  if (seen.has(value as object)) return '[Circular]'
  seen.add(value as object)
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1, seen))
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.test(key)) {
      result[key] = '[Filtered]'
    } else {
      result[key] = sanitize(val, depth + 1, seen)
    }
  }
  return result
}

class Logger {
  private buffer = new RingBuffer<LogEntry>(500)
  private _level: LogLevel = 'debug'
  private counter = 0

  setLevel(level: LogLevel): void {
    this._level = level
  }

  get level(): LogLevel {
    return this._level
  }

  debug(message: string, data?: unknown, source?: LogSource): void {
    this.log('debug', message, data, source)
  }

  info(message: string, data?: unknown, source?: LogSource): void {
    this.log('info', message, data, source)
  }

  warn(message: string, data?: unknown, source?: LogSource): void {
    this.log('warn', message, data, source)
  }

  error(message: string, data?: unknown, source?: LogSource): void {
    this.log('error', message, data, source)
  }

  getBuffer(): LogEntry[] {
    return this.buffer.getAll()
  }

  clear(): void {
    this.buffer.clear()
  }

  export(): void {
    const logs = this.buffer.getAll()
    const blob = new Blob(
      [JSON.stringify(logs, (_, value) => {
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack }
        }
        return value
      }, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crosslink-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  private log(level: LogLevel, message: string, data?: unknown, source?: LogSource): void {
    const entry: LogEntry = {
      id: ++this.counter,
      level,
      timestamp: Date.now(),
      message,
      source,
      data: data ? sanitize(data) : undefined,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
    }

    this.buffer.push(entry)

    if (LEVEL_ORDER[level] >= LEVEL_ORDER[this._level]) {
      formatConsole(entry)
    }
  }
}

export const logger = new Logger()

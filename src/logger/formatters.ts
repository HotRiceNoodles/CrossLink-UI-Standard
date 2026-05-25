// src/logger/formatters.ts
import type { LogLevel, LogEntry } from './types'

const LEVEL_METHOD: Record<LogLevel, typeof console.log> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

const LEVEL_LABEL: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function extractError(data: unknown): Error | undefined {
  if (!data || typeof data !== 'object') return undefined
  const obj = data as Record<string, unknown>
  if (obj.error instanceof Error) return obj.error
  return undefined
}

export function formatConsole(entry: LogEntry): void {
  const fn = LEVEL_METHOD[entry.level]
  const time = formatTime(entry.timestamp)
  const source = entry.source ? ` [${entry.source}]` : ''
  const header = `[${time}] [${LEVEL_LABEL[entry.level]}]${source} ${entry.message}`

  const err = extractError(entry.data)
  const hasExtra = err || entry.data || entry.context

  if (hasExtra) {
    fn(header)
    console.groupCollapsed('  详情')
    if (err) {
      console.error(err)
    }
    if (entry.data && !err) {
      console.log('data:', entry.data)
    } else if (entry.data && err) {
      const rest = { ...(entry.data as Record<string, unknown>) }
      delete rest.error
      if (Object.keys(rest).length > 0) {
        console.log('data:', rest)
      }
    }
    if (entry.context) {
      console.log('context:', entry.context)
    }
    console.groupEnd()
  } else {
    fn(header)
  }
}

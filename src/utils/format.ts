import dayjs from 'dayjs'

export function formatTime(value: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!value) return '-'
  return dayjs(value).format(format)
}

/** Human-readable latency: integer ms when <1000ms, else seconds with two decimals. */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/** Compact token/counts: `1.2M`, `3.4K`, else the raw number. */
export function formatTokensCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

/** Locale-formatted number (e.g. `1,234,567`). */
export function formatTokensLocale(value: number): string {
  return value.toLocaleString()
}

/** Compact cost in USD: `1.23M`, `4.56K`, else two decimals. */
export function formatCost(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toFixed(2)
}

/** CSS class for an HTTP status code (used by status badges across ops views). */
export function statusClass(code: number): string {
  if (code >= 200 && code < 300) return 'success'
  if (code === 429) return 'rate-limit'
  if (code >= 400 && code < 500) return 'warn'
  if (code >= 500) return 'error'
  return 'default'
}

import dayjs from 'dayjs'
import type { DataLensQueryResult, DataLensMetricKey } from '@/types'

/**
 * Helpers that turn a DataLens query result into the flat arrays the dashboard
 * chart/table components consume. Keeping DataLens-shape knowledge in one place
 * means the presentational components stay generic.
 */

function num(v: string | number | undefined | null): number {
  if (v === undefined || v === null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/** X-axis labels (MM/DD) extracted from the `time_bucket` column of a time query. */
export function toTimeLabels(rows: Record<string, string | number>[]): string[] {
  return rows.map((r) => {
    const raw = r.time_bucket
    if (!raw) return ''
    const d = dayjs(String(raw))
    return d.isValid() ? d.format('MM/DD') : String(raw)
  })
}

/** Numeric series for a single metric across a time query. */
export function toSeries(
  rows: Record<string, string | number>[],
  metric: DataLensMetricKey,
): number[] {
  return rows.map((r) => num(r[metric] as string | number | undefined))
}

export interface TopNRow {
  name: string
  values: Record<string, number>
}

/**
 * Collapse a top-N query result into `{ name, values }` rows.
 * `dimensionKey` is the row field holding the label (e.g. 'model' / 'key' / 'team').
 */
export function toTopN(
  result: DataLensQueryResult | null | undefined,
  dimensionKey: string,
  metrics: DataLensMetricKey[],
): TopNRow[] {
  if (!result?.rows?.length) return []
  return result.rows.map((r) => {
    const values: Record<string, number> = {}
    metrics.forEach((m) => {
      values[m] = num(r[m] as string | number | undefined)
    })
    return { name: String(r[dimensionKey] ?? '—'), values }
  })
}

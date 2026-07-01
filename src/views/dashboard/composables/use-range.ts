import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import type { DataLensTimeRange } from '@/types'

export type RangePreset = 'today' | '7d' | '30d' | '90d'

export interface RangeOption {
  value: RangePreset
  labelKey: string
}

export const RANGE_OPTIONS: RangeOption[] = [
  { value: 'today', labelKey: 'dashboard.range.today' },
  { value: '7d', labelKey: 'dashboard.range.7d' },
  { value: '30d', labelKey: 'dashboard.range.30d' },
  { value: '90d', labelKey: 'dashboard.range.90d' },
]

/**
 * Dashboard time-range selector state.
 *
 * Drives three downstream contracts from a single preset:
 *  - `days` for `/usage/daily` and `/usage/models`
 *  - `{ start_date, end_date }` (YYYY-MM-DD) for `/usage/stats`
 *  - a DataLens `time_range` object (preset, or absolute for "today")
 */
export function useRange(defaultPreset: RangePreset = '7d') {
  const range = ref<RangePreset>(defaultPreset)

  const days = computed(() => {
    switch (range.value) {
      case 'today':
        return 1
      case '7d':
        return 7
      case '30d':
        return 30
      case '90d':
        return 90
      default:
        return 7
    }
  })

  /** YYYY-MM-DD bounds for the /usage/stats `start_date`/`end_date` params. */
  const dateBounds = computed(() => {
    const end = dayjs()
    const start = end.subtract(days.value - 1, 'day')
    return {
      start_date: start.format('YYYY-MM-DD'),
      end_date: end.format('YYYY-MM-DD'),
    }
  })

  /** DataLens time_range — "today" has no preset, so use absolute bounds. */
  const datalensTimeRange = computed<DataLensTimeRange>(() => {
    if (range.value === 'today') {
      const start = dayjs().startOf('day')
      const end = dayjs()
      return { type: 'absolute', start: start.toISOString(), end: end.toISOString() }
    }
    const presetMap = { '7d': 'last_7d', '30d': 'last_30d', '90d': 'last_90d' } as const
    return { type: 'preset', preset: presetMap[range.value] }
  })

  return { range, days, dateBounds, datalensTimeRange }
}

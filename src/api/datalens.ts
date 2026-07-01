import { post } from './interceptor'
import type {
  DataLensQueryParams,
  DataLensQueryResult,
  DataLensMetricKey,
  DataLensDimensionKey,
  DataLensTimeRange,
} from '@/types'

export const datalensApi = {
  /** Run an OLAP query against the pre-aggregated metrics tables (Pro+). */
  query: (params: DataLensQueryParams) => post<DataLensQueryResult>('/datalens/query', params),
}

// — query builders — centralize time-range + payload shape so callers stay tidy.

/** Build a timeseries query (one row per time bucket) for the given metrics. */
export function buildTimeseriesQuery(
  metrics: DataLensMetricKey[],
  timeRange: DataLensTimeRange,
  granularity: 'hour' | 'day' = 'day',
): DataLensQueryParams {
  return {
    dimensions: ['time'],
    metrics,
    time_range: timeRange,
    granularity,
  }
}

/** Build a top-N query ranked by `sortBy` for a single breakdown dimension. */
export function buildTopNQuery(
  dimension: DataLensDimensionKey,
  metrics: DataLensMetricKey[],
  timeRange: DataLensTimeRange,
  sortBy: DataLensMetricKey,
  limit = 10,
): DataLensQueryParams {
  return {
    dimensions: [dimension],
    metrics,
    time_range: timeRange,
    granularity: 'day',
    sort_by: sortBy,
    sort_order: 'desc',
    limit,
  }
}

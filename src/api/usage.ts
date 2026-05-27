import { get } from './interceptor'
import type { UsageStats, DailyTrend, ModelDistribution, UsageQuery, UsageLog } from '@/types'

export const usageApi = {
  stats: (params?: UsageQuery) =>
    get<UsageStats>('/usage/stats', params as Record<string, unknown>),
  daily: (params?: UsageQuery & { days?: number }) =>
    get<DailyTrend[]>('/usage/daily', params as Record<string, unknown>),
  models: (params?: UsageQuery & { days?: number }) =>
    get<ModelDistribution[]>('/usage/models', params as Record<string, unknown>),
  requestLogs: (params?: UsageQuery) =>
    get<UsageLog[]>('/usage', params as Record<string, unknown>),
}

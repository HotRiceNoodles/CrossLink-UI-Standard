import { get } from './interceptor'
import type {
  UsageStats,
  DailyTrend,
  ModelDistribution,
  TeamStat,
  RoutingStats,
  UsageQuery,
  UsageLog,
} from '@/types'

export const usageApi = {
  stats: (params?: UsageQuery) =>
    get<UsageStats>('/usage/stats', params as Record<string, unknown>),
  daily: (params?: UsageQuery & { days?: number }) =>
    get<DailyTrend[]>('/usage/daily', params as Record<string, unknown>),
  models: (params?: UsageQuery & { days?: number }) =>
    get<ModelDistribution[]>('/usage/models', params as Record<string, unknown>),
  teamStats: (params?: UsageQuery & { days?: number }) =>
    get<TeamStat[]>('/usage/team-stats', params as Record<string, unknown>),
  // 注意：/routing/stats 是 admin 端点里唯一未用 {data:...} 包装的，
  // body 本身即 RoutingStats。get<T> 在运行时返回 body，故这里按解包后的形状暴露。
  routingStats: (params: { model: string; days?: number }): Promise<RoutingStats> =>
    get<RoutingStats>(
      '/routing/stats',
      params as Record<string, unknown>,
    ) as unknown as Promise<RoutingStats>,
  requestLogs: (params?: UsageQuery) =>
    get<UsageLog[]>('/usage', params as Record<string, unknown>),
}

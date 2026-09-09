import request, { get } from './interceptor'
import type {
  UsageStats,
  DailyTrend,
  ModelDistribution,
  TeamStat,
  TemplateStat,
  RoutingStats,
  UsageQuery,
  UsageLog,
} from '@/types'

/** 从 Content-Disposition 解析 filename，失败回退默认名。 */
function parseFilename(disposition: unknown, fallback: string): string {
  const m = typeof disposition === 'string' ? disposition.match(/filename="?([^";]+)"?/) : null
  return m ? m[1] : fallback
}

export const usageApi = {
  stats: (params?: UsageQuery) =>
    get<UsageStats>('/usage/stats', params as Record<string, unknown>),
  daily: (params?: UsageQuery & { days?: number }) =>
    get<DailyTrend[]>('/usage/daily', params as Record<string, unknown>),
  models: (params?: UsageQuery & { days?: number }) =>
    get<ModelDistribution[]>('/usage/models', params as Record<string, unknown>),
  teamStats: (params?: UsageQuery & { days?: number }) =>
    get<TeamStat[]>('/usage/team-stats', params as Record<string, unknown>),
  templateStats: (params?: UsageQuery & { days?: number }) =>
    get<TemplateStat[]>('/usage/templates', params as Record<string, unknown>),
  // 注意：/routing/stats 是 admin 端点里唯一未用 {data:...} 包装的，
  // body 本身即 RoutingStats。get<T> 在运行时返回 body，故这里按解包后的形状暴露。
  routingStats: (params: { model: string; days?: number }): Promise<RoutingStats> =>
    get<RoutingStats>(
      '/routing/stats',
      params as Record<string, unknown>,
    ) as unknown as Promise<RoutingStats>,
  requestLogs: (params?: UsageQuery) =>
    get<UsageLog[]>('/usage', params as Record<string, unknown>),
  /**
   * 对账 CSV 导出（按 Key × 模型聚合）。响应是文件流，必须走原始 axios
   * 实例（JWT 注入）+ responseType blob；后端出错时返回的 JSON 错误体
   * 也会被包成 blob，由调用方检测 blob.type 后提示。
   */
  exportReconciliation: async (params: { days?: number; key_id?: number }) => {
    const res = await request.get('/usage/reconciliation/export', {
      params,
      responseType: 'blob',
    })
    const blob = res.data as Blob
    if (blob.type.includes('json')) {
      // 错误响应（非 2xx 由拦截器 reject，此分支兜底 200 但内容为 JSON 的场景）
      const text = await blob.text()
      let msg = ''
      try {
        msg = JSON.parse(text)?.error || ''
      } catch {
        // 非 JSON 内容，保持默认空串
      }
      throw new Error(msg || 'export failed')
    }
    const fallback = `reconciliation-${new Date().toISOString().slice(0, 10)}.csv`
    const filename = parseFilename(res.headers?.['content-disposition'], fallback)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}

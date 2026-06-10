import { get, post, put, del } from './interceptor'
import type {
  GuardrailRule,
  GuardrailCreateRequest,
  GuardrailConfig,
  GuardrailTestResult,
  GuardrailAlertLog,
  AlertLogQuery,
  AlertLogStats,
  AlertLogStatsQuery,
} from '@/types'

export const guardrailApi = {
  // 规则 CRUD
  list: (params?: { type?: string; enabled?: string }) =>
    get<GuardrailRule[]>('/guardrails', params as Record<string, unknown>),
  create: (data: GuardrailCreateRequest) => post<GuardrailRule>('/guardrails', data),
  update: (id: number, data: Partial<GuardrailCreateRequest>) =>
    put<GuardrailRule>(`/guardrails/${id}`, data),
  delete: (id: number) => del<void>(`/guardrails/${id}`),

  // 规则测试
  test: (id: number, text: string) => post<GuardrailTestResult>(`/guardrails/${id}/test`, { text }),

  // 规则统计
  stats: (startTime?: string) =>
    get<Array<{ guardrail_rule: string; count: number }>>(
      '/guardrails/stats',
      startTime ? ({ start_time: startTime } as Record<string, unknown>) : undefined,
    ),

  // 全局配置
  getConfig: () => get<GuardrailConfig>('/guardrails/config'),
  updateConfig: (data: Partial<GuardrailConfig>) =>
    put<GuardrailConfig>('/guardrails/config', data),
}

export const alertLogApi = {
  list: (params: AlertLogQuery) =>
    get<GuardrailAlertLog[]>('/guardrail-alerts/logs', params as Record<string, unknown>),
  detail: (id: number) => get<GuardrailAlertLog>(`/guardrail-alerts/logs/${id}`),
  stats: (params?: AlertLogStatsQuery) =>
    get<AlertLogStats>('/guardrail-alerts/logs/stats', params as Record<string, unknown>),
}

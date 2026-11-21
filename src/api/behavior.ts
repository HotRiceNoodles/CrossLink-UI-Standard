import { get, post } from './interceptor'
import type {
  BehaviorAnomaly,
  BehaviorAnomalyQuery,
  BehaviorCoverageRow,
  BehaviorDecideResult,
  BehaviorFingerprint,
  BehaviorPagedResponse,
  BehaviorStatus,
} from '@/types'

/**
 * 行为基线防护台账（Pro：behavior:view 查看 / behavior:manage 裁决）。
 * observe-only：confirm/dismiss/approve/retire 都不触发任何处置动作。
 */
export const behaviorApi = {
  status: () => get<BehaviorStatus>('/behavior/status'),

  anomalies: (params?: BehaviorAnomalyQuery) =>
    get<BehaviorAnomaly[]>('/behavior/anomalies', {
      ...params,
    } as Record<string, unknown>) as Promise<BehaviorPagedResponse<BehaviorAnomaly>>,

  anomaly: (id: number) => get<BehaviorAnomaly>(`/behavior/anomalies/${id}`),

  /** 判定为真异常（终态；反馈写入 tolerance，confirmed 额外产出指纹候选） */
  confirm: (id: number) => post<BehaviorDecideResult>(`/behavior/anomalies/${id}/confirm`),
  /** 判定为误报（终态） */
  dismiss: (id: number) => post<BehaviorDecideResult>(`/behavior/anomalies/${id}/dismiss`),

  fingerprints: (params?: { status?: string; page?: number; page_size?: number }) =>
    get<BehaviorFingerprint[]>('/behavior/fingerprints', {
      ...params,
    } as Record<string, unknown>) as Promise<BehaviorPagedResponse<BehaviorFingerprint>>,

  /** 记为已知异常模式（不自动生效） */
  approveFingerprint: (id: number) =>
    post<{ id: number; status: string }>(`/behavior/fingerprints/${id}/approve`),
  /** 误报模式退役 */
  retireFingerprint: (id: number) =>
    post<{ id: number; status: string }>(`/behavior/fingerprints/${id}/retire`),

  coverage: () => get<BehaviorCoverageRow[]>('/behavior/coverage'),
}

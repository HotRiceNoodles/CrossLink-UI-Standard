// 行为基线防护台账（后端规划冻结 v4.0；Pro 档 behavior:view/manage）
// 镜像 internal/model/behavior.go 与 internal/admin/behavior.go 的 DTO。

import type { ApiResponse } from './index'

// 异常事件（behavior_anomalies；合并语义在应用层，open 才可裁决且终态不可改）
export type BehaviorAnomalyStatus = 'open' | 'confirmed' | 'dismissed' | 'expired'
export type BehaviorBand = 'suspicious' | 'anomalous' | 'critical'

export interface BehaviorAnomaly {
  id: number
  event_fingerprint: string
  entity_type: 'key' | 'org'
  entity_id: number
  org_id?: number
  score: number
  score_peak: number
  band: BehaviorBand
  /** 命中维度得分与当时基线快照（JSON 字符串，事后可解释） */
  dimensions?: string | null
  baseline_model_version: number
  first_seen_at: string
  last_hit_at: string
  hit_count: number
  window_start: string
  window_end: string
  status: BehaviorAnomalyStatus
  closed_reason?: string | null
  decided_by?: string | null
  created_at: string
  updated_at: string
}

// 行为指纹（behavior_fingerprints；confirmed 异常产出的候选，人在环复核；
// approve 不自动生效 —— observe-only 纪律）
export type BehaviorFingerprintStatus = 'candidate' | 'approved' | 'retired'

export interface BehaviorFingerprint {
  id: number
  entity_type: 'key' | 'org'
  entity_id: number
  /** 命中维度名排序 CSV */
  dimension_set: string
  /** 各维度取值模板 JSON */
  template: string
  source_event_id?: number | null
  hit_count: number
  status: BehaviorFingerprintStatus
  decided_by?: string | null
  created_at: string
  updated_at: string
}

// GET /behavior/status —— 部署诊断：为什么没在学习
export interface BehaviorJobStatus {
  job: string
  fence: number
  lease_until: string
  lease_active: boolean
}

export interface BehaviorStatus {
  enabled: boolean
  jobs: BehaviorJobStatus[]
  counts: {
    rollups: number
    baselines: number
    seen_categories: number
    anomalies_total: number
    anomalies_open: number
    fingerprints_candidate: number
  }
  last_baseline_computed_at?: string | null
  learning_stale: boolean
}

// GET /behavior/coverage —— 近 7 天有活动实体的基线覆盖率（不允许静默无保护）
export interface BehaviorCoverageRow {
  entity_type: 'key' | 'org'
  entity_id: number
  rollup_metrics: number
  baseline_metrics: number
  protected: boolean
}

// 列表响应：分页字段在 data 之外
export interface BehaviorPagedResponse<T> extends ApiResponse<T> {
  total: number
  page: number
  page_size: number
}

export interface BehaviorAnomalyQuery {
  status?: BehaviorAnomalyStatus
  band?: BehaviorBand
  entity_type?: 'key' | 'org'
  entity_id?: number
  org_id?: number
  page?: number
  page_size?: number
}

// confirm/dismiss 响应（反馈失败不回滚裁决，只显式透出）
export interface BehaviorDecideResult {
  id: number
  status: BehaviorAnomalyStatus
  decided_by: string
}

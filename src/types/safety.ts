// 内容安全模块类型定义

import type { ApiResponse } from './index'

// 引擎类型枚举
export type GuardrailEngineType =
  | 'keyword_filter'
  | 'pii_detection'
  | 'prompt_injection'
  | 'credential_detection'
  | 'openai_moderation'
  | 'content_length'
  | 'agent_fingerprint'
  | 'behavior_analysis'
  | 'webhook'
  | 'ip_binding'

// 检测方向
export type GuardrailDirection = 'request' | 'response' | 'both' | 'ingress' | 'egress'

// 严重程度
export type GuardrailSeverity = 'low' | 'medium' | 'high' | 'warning' | 'critical'

// 处理动作
export type GuardrailAction = 'block' | 'log' | 'mask'

// 护栏规则
export interface GuardrailRule {
  id: number
  org_id?: number
  name: string
  type: GuardrailEngineType
  direction: GuardrailDirection
  enabled: boolean
  config: Record<string, unknown>
  severity: GuardrailSeverity
  action: GuardrailAction
  model_filter?: string
  /** 版本化写路径维护的单调递增版本号；并发修改会返回 409 version_conflict。 */
  version: number
  created_at: string
  updated_at: string
}

// 规则历史快照（append-only，config 已在服务端脱敏）
export interface GuardrailRuleVersion {
  id: number
  rule_id: number
  version: number
  name: string
  type: GuardrailEngineType
  direction: GuardrailDirection
  enabled: boolean
  config: Record<string, unknown>
  severity: GuardrailSeverity
  action: GuardrailAction
  model_filter?: string | null
  change_kind: GuardrailChangeKind
  actor: string
  created_at: string
}

export type GuardrailChangeKind = 'create' | 'update' | 'delete' | 'rollback' | 'migrate'

// GET /guardrails/versions 响应（current_version 在 data 之外）
export interface GuardrailVersionsResponse extends ApiResponse<GuardrailRuleVersion[]> {
  current_version: number
}

// 回滚请求：把历史版本作为新版本恢复（delete 快照不可回滚）
export interface GuardrailRollbackRequest {
  to_version: number
}

// 创建规则请求
export interface GuardrailCreateRequest {
  name: string
  type: GuardrailEngineType
  direction: GuardrailDirection
  enabled?: boolean
  config: Record<string, unknown>
  severity?: GuardrailSeverity
  action?: GuardrailAction
  model_filter?: string
}

// 护栏全局配置
// NOTE: stream_*/budget/action/coverage 字段由较新后端返回，全部可选，
// 旧后端（仅 enabled/log_only/fail_open）的载荷仍能通过类型检查。
export type GuardrailStreamMode = 'window' | 'strict'
export type GuardrailOversizeAction = 'truncate' | 'reject'
export type GuardrailEngineErrorAction = 'skip' | 'block'

export interface GuardrailConfig {
  enabled: boolean
  log_only: boolean
  fail_open: boolean
  /** 流式检查模式：window 按增量窗口检查；strict 缓冲至完整响应，超限即阻断。 */
  stream_mode?: GuardrailStreamMode
  stream_strict_max_runes?: number
  stream_strict_max_bytes?: number
  stream_strict_max_events?: number
  /** 单次请求/响应护栏检查的超时预算（毫秒，正整数）。 */
  request_budget_ms?: number
  response_budget_ms?: number
  /** 内容超过大小上限时的处理。 */
  oversize_action?: GuardrailOversizeAction
  /** 引擎错误时的处理。 */
  engine_error_action?: GuardrailEngineErrorAction
  /** 截断后的检查视为部分覆盖（标记），而非干净通过。 */
  strict_coverage?: boolean
}

// 规则测试结果
export interface GuardrailTestResult {
  blocked: boolean
  rule_name: string
  reason: string
  severity: GuardrailSeverity
  masked_content?: string
  content_snippet?: string
}

// 告警日志状态
export type AlertLogStatus = 'logged' | 'sent' | 'partial' | 'failed' | 'dropped' | 'blocked'

// 告警日志
export interface GuardrailAlertLog {
  id: number
  org_id?: number
  rule_id: number
  alert_rule_id: number
  rule_name: string
  engine_type: GuardrailEngineType
  severity: GuardrailSeverity
  action: GuardrailAction
  direction: GuardrailDirection
  reason: string
  model: string
  content_preview?: string
  api_key_id: number
  team_id: number
  agent_type: string
  channels: string
  status: AlertLogStatus
  created_at: string
}

// 告警日志查询参数
export interface AlertLogQuery {
  page?: number
  page_size?: number
  rule_id?: number
  engine_type?: string
  severity?: string
  action?: string
  status?: string
  start_time?: string
  end_time?: string
  include_content?: string
}

// 告警日志列表响应 — 后端 ListLogs 返回扁平信封 { data, total, page, page_size }，
// 而非 ApiResponse 的嵌套 pagination。这里显式建模该契约。
export interface AlertLogListResponse extends ApiResponse<GuardrailAlertLog[]> {
  total?: number
  page?: number
  page_size?: number
}

// 告警统计
export interface AlertLogStats {
  by_rule: Array<{ rule_name: string; count: number }>
  by_time: Array<{ bucket: string; count: number }>
}

// 告警统计查询参数
export interface AlertLogStatsQuery {
  granularity?: 'hour' | 'day'
  start_time?: string
  end_time?: string
  severity?: string
  action?: string
  status?: string
  engine_type?: string
}

// ---- 引擎配置 Schema 类型 ----
export type ConfigFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'string_array' // a-input-tag（关键词列表等）
  | 'key_value_map' // 复杂 - 仅 JSON 模式编辑
  | 'object_array' // 复杂 - 仅 JSON 模式编辑

export interface ConfigFieldOption {
  label: string // i18n key
  value: string
}

export interface ConfigFieldSchema {
  key: string
  type: ConfigFieldType
  labelKey: string
  placeholderKey?: string
  tooltipKey?: string
  required?: boolean
  defaultValue?: unknown
  sensitive?: boolean // true → a-input-password
  options?: ConfigFieldOption[]
  min?: number
  max?: number
  step?: number
  precision?: number
}

export interface EngineConfigSchema {
  engineType: GuardrailEngineType
  fields: ConfigFieldSchema[]
  hasComplexFields: boolean // 含 object_array / key_value_map 时为 true
}

export type ConfigEditorMode = 'form' | 'json'

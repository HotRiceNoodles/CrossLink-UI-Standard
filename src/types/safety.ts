// 内容安全模块类型定义

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

// 检测方向
export type GuardrailDirection = 'request' | 'response' | 'both'

// 严重程度
export type GuardrailSeverity = 'low' | 'medium' | 'high' | 'critical'

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
  config: Record<string, any>
  severity: GuardrailSeverity
  action: GuardrailAction
  model_filter?: string
  created_at: string
  updated_at: string
}

// 创建规则请求
export interface GuardrailCreateRequest {
  name: string
  type: GuardrailEngineType
  direction: GuardrailDirection
  enabled?: boolean
  config: Record<string, any>
  severity?: GuardrailSeverity
  action?: GuardrailAction
  model_filter?: string
}

// 护栏全局配置
export interface GuardrailConfig {
  enabled: boolean
  log_only: boolean
  fail_open: boolean
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
export type AlertLogStatus = 'logged' | 'sent' | 'partial' | 'failed' | 'dropped'

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

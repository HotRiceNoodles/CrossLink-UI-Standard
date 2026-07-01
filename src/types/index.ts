// API response wrapper
export interface ApiResponse<T = unknown> {
  data: T
  error?: string
  error_code?: string
  pagination?: Pagination
}

export interface Pagination {
  total: number
  page: number
  page_size: number
}

// Auth
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  permissions: string[]
  tier: string
}

export interface User {
  id: number
  username: string
  display_name: string
  role_id: number
  role_name: string
  org_id: number | null
  org_name: string | null
  org_role: string | null
  force_password_change?: boolean
}

export interface OrgContext {
  orgId: number
  orgName: string
  orgRole: string
}

export interface SwitchOrgResponse {
  token: string
  org_id: number
  org_name: string
  org_display_name: string
}

// Provider
export interface Adapter {
  type: string
  display_name: string
  description: string
  needs_base_url: boolean
  needs_api_key: boolean
  base_url_default: string
  protocol_base_urls: Record<string, string>
  capabilities: string[]
  extra_fields: AdapterField[]
  minimum_tier: string
}

export interface AdapterField {
  key: string
  label: string
  type: 'text' | 'select' | 'number'
  required: boolean
  default?: string
  options?: { label: string; value: string }[]
}

export interface Provider {
  id: number
  name: string
  display_name: string
  adapter_type: string
  base_url: string
  api_key: string
  extra_config: Record<string, unknown>
  status: number
  created_at: string
  updated_at: string
}

export interface ProviderCreateRequest {
  name: string
  display_name: string
  adapter_type: string
  base_url?: string
  api_key?: string
  extra_config?: Record<string, unknown>
}

// Model
export interface ProviderModel {
  id: number
  provider_id: number
  model_name: string
  provider_model: string
  weight: number
  priority: number
  status: number
  max_context: number | null
  input_price: number | null
  output_price: number | null
  currency: string
  routing_strategy: string
  extra_config: Record<string, unknown>
  created_at: string
  updated_at: string
  provider?: Provider
}

export interface ModelCreateRequest {
  provider_id: number
  model_name: string
  provider_model: string
  weight?: number
  priority?: number
  status?: number
  max_context?: number | null
  input_price?: number | null
  output_price?: number | null
  currency?: string
  routing_strategy?: string
  extra_config?: Record<string, unknown>
}

// API Key
export interface APIKey {
  id: number
  name: string
  key_prefix: string
  status: number
  allowed_models: string[]
  allowed_routes: string[]
  tpm_limit: number
  rpm_limit: number
  max_budget: number | null
  budget_period: string
  max_calls: number
  call_period: string
  expires_at: string | null
  created_at: string
  updated_at: string
  last_used_at: string | null
  created_by: string
  created_by_id: number
  team_id: number | null
}

export interface KeyCreateRequest {
  name: string
  allowed_models?: string[]
  allowed_routes?: string[]
  tpm_limit?: number
  rpm_limit?: number
  max_budget?: number | null
  budget_period?: string
  max_calls?: number
  call_period?: string
}

export interface KeyCreateResponse {
  key: string
  key_prefix: string
  message: string
}

// Usage
// NOTE: the backend `/usage/stats` handler returns far more fields than the
// dashboard previously modeled. All extended fields are optional so partial
// payloads (e.g. org-scoped queries that omit member_count/total_api_keys)
// still type-check.
export interface UsageStats {
  total_requests: number
  total_tokens: number
  total_cost: number
  avg_latency_ms: number
  cost_by_currency: Record<string, number>
  organization_count?: number
  member_count?: number
  total_api_keys?: number
  // — extended fields (already returned by the backend) —
  total_sessions?: number
  input_tokens?: number
  output_tokens?: number
  reasoning_tokens?: number
  cache_read_tokens?: number
  cost_per_1k_tokens?: number
  cost_per_request?: number
  avg_first_token_ms?: number
  error_rate?: number
  active_api_keys?: number
  fallback_rate?: number
  retry_rate?: number
  guardrail_block_rate?: number
  currency?: string
}

// DataLens OLAP query engine (Pro+). Mirrors backend QueryParams/QueryResult
// in internal/admin/datalens.go and internal/repository/datalens_store.go.
export type DataLensDimensionKey =
  | 'time'
  | 'model'
  | 'team'
  | 'key'
  | 'provider'
  | 'status'
  | 'currency'
export type DataLensMetricKey =
  | 'requests'
  | 'cost'
  | 'input_tokens'
  | 'output_tokens'
  | 'total_tokens'
  | 'reasoning_tokens'
  | 'cache_read_tokens'
  | 'avg_latency'
  | 'avg_ttft'
  | 'cost_per_1k'
  | 'cost_per_request'
  | 'error_rate'
  | 'fallback_rate'
  | 'retry_rate'
  | 'guardrail_rate'
  | 'cache_hit_rate'

export interface DataLensFilter {
  dimension: string
  operator:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'in'
    | 'not_in'
    | 'between'
    | 'is_null'
    | 'is_not_null'
  value?: string | number | Array<string | number>
}

export interface DataLensTimeRange {
  type: 'preset' | 'absolute'
  preset?: 'last_7d' | 'last_30d' | 'last_90d' | 'this_month' | 'last_month'
  start?: string
  end?: string
}

export interface DataLensQueryParams {
  dimensions?: DataLensDimensionKey[]
  metrics: DataLensMetricKey[]
  filters?: DataLensFilter[]
  time_range: DataLensTimeRange
  granularity?: 'hour' | 'day' | 'week' | 'month'
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
}

export interface DataLensColumn {
  key: string
  label: string
  type: string
}

export interface DataLensQueryMeta {
  query_time_ms?: number
  data_source?: string
  currency?: string
  last_aggregated_at?: string
  stale_warning?: boolean
}

export interface DataLensQueryResult {
  columns: DataLensColumn[]
  rows: Record<string, string | number>[]
  total: number
  meta?: DataLensQueryMeta
}

export interface DailyTrend {
  date: string
  count: number
  tokens: number
  cost: number
}

export interface ModelDistribution {
  model: string
  count: number
  tokens: number
  cost: number
}

export interface UsageQuery {
  model?: string
  provider_id?: number
  team_id?: number
  api_key_id?: number
  start_date?: string
  end_date?: string
  has_fallback?: boolean
  status?: string
  page?: number
  page_size?: number
}

// System
export interface SystemInfo {
  db_status: string
  redis_status: string
  admin_username: string
  token_expiry: string
  version: string
}

// License
export interface LicenseStatus {
  tier: string
  edition: string
  is_valid: boolean
  fingerprint: string
  crypto_mode: string
  license_management: boolean
  license_id: string | null
  expires_at: string | null
  max_nodes: number | null
}

// System Settings
export interface SystemSettings {
  log_content: boolean
  debug_mode: boolean
  log_middleware_errors: Record<string, unknown> | null
  circuit_breaker_threshold: number
  circuit_breaker_duration: number
  retry_budget_per_second: number
  key_email_doc_url: string
}

// Usage Log
export interface UsageLog {
  id: number
  request_id: string
  api_key_id?: number | null
  provider_id?: number | null
  route_type: string
  model_requested: string
  model_used: string
  input_tokens: number
  output_tokens: number
  cost: number
  latency_ms: number
  first_token_ms?: number | null
  status_code: number
  error_type?: string
  currency: string
  team_id?: number | null
  fallback_count: number
  retry_count: number
  guardrail_triggered: boolean
  guardrail_rule?: string
  cache_hit: boolean
  agent_type?: string
  security_events?: Record<string, unknown>[]
  user_message?: string
  model_response?: string
  created_at: string
}

export * from './auth-module'
export * from './playground'
export * from './safety'
export * from './debug'

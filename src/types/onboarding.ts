/**
 * Onboarding 向导相关类型，与后端 `internal/admin/onboarding.go` 1:1 对齐。
 *
 * 两个端点（均在 /admin/api 下，需 JWT）：
 *   POST /providers/probe     — 无状态探测，始终 200（失败也 200 + success:false）
 *   POST /system/onboarding   — 事务内原子创建 provider+models+key，成功 201
 */

// ===== Probe =====

export interface ProbeRequest {
  /** 必填，例如 openai_compatible / anthropic / azure / ollama */
  adapter_type: string
  base_url?: string
  api_key?: string
  extra_config?: Record<string, unknown>
}

export interface ProbeModel {
  id: string
  owned_by?: string
}

/**
 * Probe 响应（data 字段）。后端始终返 200，三种形态合并为单 interface：
 * - 成功且支持列模型：success=true, models_supported=true, models=[...]
 * - 成功但不支持列模型（如 anthropic）：success=true, models_supported=false
 * - 失败：success=false, error=...
 */
export interface ProbeResult {
  success: boolean
  models_supported: boolean
  latency_ms?: number
  models?: ProbeModel[]
  error?: string
}

// ===== Commit =====

export interface OnboardingProviderInput {
  /** 必填，唯一标识 */
  name: string
  /** 必填，人类可读 */
  display_name: string
  /** 必填 */
  adapter_type: string
  base_url?: string
  api_key?: string
  extra_config?: Record<string, unknown>
}

export interface OnboardingModelInput {
  /** 必填，网关面向用户的模型名 */
  model_name: string
  /** 必填，上游真实模型 ID */
  provider_model: string
  weight?: number
  priority?: number
  /** 必须 >= 0 */
  input_price?: number
  /** 必须 >= 0 */
  output_price?: number
  currency?: string
  /** 默认 weighted_random */
  routing_strategy?: string
}

export interface OnboardingKeyInput {
  /** 必填，max 64 */
  name: string
  allowed_models?: string[]
  tpm_limit?: number
  rpm_limit?: number
  /** 必须 >= 0 */
  max_budget?: number
  budget_period?: string
  /** ISO 8601，必须在未来 */
  expires_at?: string
}

export interface OnboardingRequest {
  provider: OnboardingProviderInput
  models?: OnboardingModelInput[]
  key: OnboardingKeyInput
}

export interface OnboardingResult {
  provider_id: number
  model_ids: number[]
  /** 明文 Key，仅此一次返回 */
  key: string
  /** 前 7 字符，例如 cl-abc12 */
  key_prefix: string
}

// ===== 向导内部用 =====

export type OnboardingMode = 'quick' | 'custom'

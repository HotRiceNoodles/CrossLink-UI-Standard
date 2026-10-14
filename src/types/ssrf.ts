// SSRF 内网 allowlist（B5）：可热更新的全局出站策略
// 写操作（PUT/DELETE）需要 reauth 令牌，见 api/ssrf.ts

// 生效来源：db（页面覆盖）> env > yaml > strict
export type SsrfSource = 'db' | 'env' | 'yaml' | 'strict'

export interface SsrfConsistency {
  /** redis = 跨实例即时广播；ttl-only = 仅周期收敛 */
  broadcast: 'redis' | 'ttl-only'
  /** 跨实例最坏收敛窗口（秒） */
  window_seconds: number
  /** 敏感操作重认证状态存放处：redis 共享 / local 单节点（此时页面写入被拒） */
  reauth?: 'redis' | 'local'
}

export interface SsrfAllowlistStatus {
  effective_cidrs: string[]
  source: SsrfSource
  /** 下次写入应携带的 expected_version；0 = 尚无 DB 行 */
  version: number
  override_active: boolean
  /** 上次加载/刷新失败原因（内存保持最后已知良好策略） */
  degraded?: string
  /** 删除页面覆盖后的回退预览；无 env/YAML 静态配置时后端返回 null */
  fallback_cidrs?: string[] | null
  fallback_source: SsrfSource
  consistency: SsrfConsistency
}

export interface SsrfApplyResult {
  version: number
  effective_cidrs: string[]
  source: SsrfSource
  /** redis = 已广播；failed = 广播失败（TTL 内仍会收敛） */
  broadcast: 'redis' | 'failed'
}

export interface SsrfReauthResponse {
  token: string
  expires_in: number
}

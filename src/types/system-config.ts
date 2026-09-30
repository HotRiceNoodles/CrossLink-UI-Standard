// GET/PUT /system/config — DB-backed runtime settings (community tier).
// Mirrors the backend settings.Registry contract: sensitive values are
// always returned as "" (meta.set carries the configured bit), durations
// are exposed in seconds, and PUT is sparse (omitted = unchanged).
export type ConfigValueType = 'string' | 'int' | 'float' | 'bool' | 'string[]' | 'duration_seconds'

export type ConfigSource = 'db' | 'default' | 'db-error'

export interface SystemConfigMeta {
  section: string
  source: ConfigSource
  restart_required: boolean
  sensitive: boolean
  type: ConfigValueType
  /** Sensitive keys only: value is configured (DB row or non-empty default). */
  set?: boolean
}

export interface SystemConfigResponse {
  settings: Record<string, string | number | boolean | string[] | undefined>
  meta: Record<string, SystemConfigMeta>
  loaded_at: string
}

export interface SystemConfigUpdateResponse {
  applied: string[]
  deleted: string[]
  restart_required_applied: string[]
}

// Frontend registry entry — drives the runtime-config form. The backend GET
// meta remains the runtime authority; this registry only fixes display order,
// labels, and client-side validation.
export interface ConfigKeyDef {
  key: string
  section: string
  type: ConfigValueType
  labelKey: string
  descKey?: string
  restart: boolean
  sensitive: boolean
  /** Hot-reload subset (applied without restart). */
  hot?: boolean
  min?: number
  max?: number
  placeholder?: string
  /** Client-side pattern for duration-string keys (datalens agg interval/lookback). */
  pattern?: RegExp
}

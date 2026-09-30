// Frontend mirror of the backend settings.Registry (internal/settings/keys.go).
// Fixes display order, section grouping, labels, and client-side validation;
// the GET /system/config meta remains the runtime authority (restart flags,
// source, sensitive bits). Update this file when the backend Registry changes.
import type { ConfigKeyDef } from '@/types'

export interface ConfigSectionDef {
  id: string
  labelKey: string
}

// Backend section order (keys.go Registry).
export const CONFIG_SECTIONS: ConfigSectionDef[] = [
  { id: 'smtp', labelKey: 'systemConfig.sections.smtp' },
  { id: 'gateway', labelKey: 'systemConfig.sections.gateway' },
  { id: 'cors', labelKey: 'systemConfig.sections.cors' },
  { id: 'rate_limit', labelKey: 'systemConfig.sections.rate_limit' },
  { id: 'captcha', labelKey: 'systemConfig.sections.captcha' },
  { id: 'datalens', labelKey: 'systemConfig.sections.datalens' },
  { id: 'mcp', labelKey: 'systemConfig.sections.mcp' },
  { id: 'guardrail_alert', labelKey: 'systemConfig.sections.guardrail_alert' },
  { id: 'ip_binding', labelKey: 'systemConfig.sections.ip_binding' },
]

// Go duration string, e.g. "300s" / "5m" / "1h30m".
const GO_DURATION_RE = /^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h))+$/

function def(key: string, section: string, type: ConfigKeyDef['type']): ConfigKeyDef {
  return {
    key,
    section,
    type,
    labelKey: `systemConfig.fields.${key}`,
    restart: false,
    sensitive: false,
  }
}

function restartable(d: ConfigKeyDef): ConfigKeyDef {
  d.restart = true
  return d
}

function withPattern(d: ConfigKeyDef): ConfigKeyDef {
  d.pattern = GO_DURATION_RE
  d.descKey = 'systemConfig.durationHint'
  return d
}

export const CONFIG_KEYS: ConfigKeyDef[] = [
  // --- smtp ---
  def('smtp_host', 'smtp', 'string'),
  { ...def('smtp_port', 'smtp', 'int'), min: 1, max: 65535 },
  def('smtp_username', 'smtp', 'string'),
  { ...def('smtp_password', 'smtp', 'string'), sensitive: true },
  def('smtp_from', 'smtp', 'string'),

  // --- gateway ---
  def('gateway_base_url', 'gateway', 'string'),

  // --- cors ---
  def('cors_allowed_origins', 'cors', 'string[]'),

  // --- rate_limit ---
  { ...def('rate_limit_rpm', 'rate_limit', 'int'), min: 0 },
  { ...def('rate_limit_tpm', 'rate_limit', 'int'), min: 0 },
  { ...def('rate_limit_tpm_reservation', 'rate_limit', 'int'), min: 0 },
  def('rate_limit_fail_closed', 'rate_limit', 'bool'),

  // --- captcha ---
  def('captcha_enabled', 'captcha', 'bool'),
  restartable(def('captcha_provider', 'captcha', 'string')),
  { ...def('captcha_trust_days', 'captcha', 'int'), min: 0, max: 365 },
  { ...def('captcha_trust_ip_mask', 'captcha', 'int'), min: 0, max: 128 },
  def('captcha_redis_fail_open', 'captcha', 'bool'),
  { ...def('captcha_slider_tolerance_px', 'captcha', 'float'), min: 0 },
  { ...def('captcha_slider_min_points', 'captcha', 'int'), min: 0 },
  { ...def('captcha_slider_bg_width', 'captcha', 'int'), min: 0 },
  { ...def('captcha_slider_bg_height', 'captcha', 'int'), min: 0 },
  { ...def('captcha_slider_piece_size', 'captcha', 'int'), min: 0 },

  // --- datalens ---
  restartable(def('datalens_enabled', 'datalens', 'bool')),
  withPattern(restartable(def('datalens_agg_interval', 'datalens', 'string'))),
  withPattern(restartable(def('datalens_agg_lookback', 'datalens', 'string'))),
  restartable({ ...def('datalens_agg_backfill_days', 'datalens', 'int'), min: 0 }),
  { ...def('datalens_retention_raw_logs_days', 'datalens', 'int'), min: 0 },
  { ...def('datalens_retention_hourly_days', 'datalens', 'int'), min: 0 },
  { ...def('datalens_retention_daily_days', 'datalens', 'int'), min: 0 },
  def('datalens_from_name', 'datalens', 'string'),
  def('datalens_from_addr', 'datalens', 'string'),

  // --- mcp (hot subset: max_servers / tool_cache_ttl / request_timeout) ---
  restartable(def('mcp_enabled', 'mcp', 'bool')),
  { ...def('mcp_max_servers', 'mcp', 'int'), min: 0, hot: true },
  { ...def('mcp_tool_cache_ttl', 'mcp', 'duration_seconds'), min: 0, hot: true },
  { ...def('mcp_request_timeout', 'mcp', 'duration_seconds'), min: 0, hot: true },
  restartable({ ...def('mcp_health_check_interval', 'mcp', 'duration_seconds'), min: 0 }),
  restartable({ ...def('mcp_http_max_idle_conns', 'mcp', 'int'), min: 1 }),
  restartable(def('mcp_rate_limit_enabled', 'mcp', 'bool')),
  restartable({ ...def('mcp_rate_limit_default_rpm', 'mcp', 'int'), min: 0 }),
  restartable({ ...def('mcp_log_retention_days', 'mcp', 'int'), min: 0 }),

  // --- guardrail_alert ---
  def('guardrail_alert_enabled', 'guardrail_alert', 'bool'),
  restartable({ ...def('guardrail_alert_concurrency', 'guardrail_alert', 'int'), min: 1, max: 64 }),
  def('guardrail_alert_content_preview', 'guardrail_alert', 'bool'),
  { ...def('guardrail_alert_content_preview_len', 'guardrail_alert', 'int'), min: 0, max: 2000 },

  // --- ip_binding ---
  { ...def('ip_binding_notify_cooldown_seconds', 'ip_binding', 'int'), min: 0, max: 86400 },
]

const BY_SECTION = new Map<string, ConfigKeyDef[]>()
export const CONFIG_KEYS_MAP = new Map<string, ConfigKeyDef>()
for (const d of CONFIG_KEYS) {
  const list = BY_SECTION.get(d.section) ?? []
  list.push(d)
  BY_SECTION.set(d.section, list)
  CONFIG_KEYS_MAP.set(d.key, d)
}

export function fieldsBySection(section: string): ConfigKeyDef[] {
  return BY_SECTION.get(section) ?? []
}

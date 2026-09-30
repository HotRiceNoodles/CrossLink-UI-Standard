// POST /system/setup/apply|skip — first-run system setup wizard.
// Writes system_settings KV rows (stats_timezone, gateway_base_url,
// encryption_key, setup_wizard_status).
export interface SetupApplyRequest {
  /** IANA name, e.g. Asia/Shanghai; empty = leave unchanged. */
  timezone: string
  /** Must be http(s) and not an internal host; empty = leave unchanged. */
  base_url: string
  /** Server-side key generation; refused (409) when a key is already active. */
  generate_encryption_key: boolean
  /** done = completed; pending = retriable partial apply. */
  status: 'done' | 'pending'
}

export interface SetupApplyResponse {
  applied: Record<string, string>
  restart_recommended: boolean
}

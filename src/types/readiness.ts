// GET /system/readiness — config doctor report. Check texts are i18n keys
// resolved client-side (doctor.check.<id>.title/detail/fixHint).
export type ReadinessSeverity = 'danger' | 'warn' | 'info' | 'ok'

export interface ReadinessCheck {
  id: string
  severity: ReadinessSeverity
  title_key: string
  detail_key: string
  detail_params?: Record<string, string | number>
  fix_hint_key?: string
  /** open_wizard | open_settings | docs */
  fix_action?: string
}

export interface ReadinessSummary {
  danger: number
  warn: number
  info: number
  ok: number
}

export interface ReadinessReport {
  generated_at: string
  tier: string
  setup_needed: boolean
  summary: ReadinessSummary
  checks: ReadinessCheck[]
}

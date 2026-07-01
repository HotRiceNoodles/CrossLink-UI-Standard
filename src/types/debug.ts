// Debug (请求调试) — mirrors backend debug_entry / analysis JSON shapes.
// Headers are serialized as Go http.Header: { "Header-Name": ["value", ...] }.
export type HttpHeaders = Record<string, string[]>

// GET /debug/entries — list item (summary)
export interface DebugEntrySummary {
  seq: number
  id: string
  timestamp: string
  duration_ms: number
  method: string
  path: string
  model: string
  status: number
  stream: boolean
  truncated: boolean
  req_body_len: number
  resp_body_len: number
  upstream_count: number
}

// GET /debug/entries/:id — upstream call within the chain
export interface UpstreamCall {
  seq: number
  provider: string
  model: string
  base_url: string
  method: string
  path: string
  req_headers: HttpHeaders
  req_body: string
  status_code: number
  resp_headers: HttpHeaders
  resp_body: string
  duration_ms: number
  attempt: number
  is_retry: boolean
  is_fallback: boolean
  error: string
}

// GET /debug/entries/:seq — full entry detail
export interface DebugEntryDetail {
  seq: number
  id: string
  timestamp: string
  duration_ms: number
  method: string
  path: string
  stream: boolean
  truncated: boolean
  req_headers: HttpHeaders
  req_body: string
  resp_status: number
  resp_headers: HttpHeaders
  resp_body: string
  upstream_calls: UpstreamCall[]
}

// GET /debug/entries/:id/analysis (Pro) — conversation analysis
export interface ImageRef {
  url: string
  media_type?: string
}

export interface StepDetail {
  text?: string
  tool_name?: string
  tool_id?: string
  tool_input?: unknown
  tool_output?: unknown
  is_error?: boolean
  thinking?: string
  images?: ImageRef[]
}

export interface TimelineStep {
  role: string // "user" | "assistant" | "tool"
  type: string // "text" | "thinking" | "tool_use" | "tool_result" | "image"
  summary: string
  detail?: StepDetail
}

export interface UsageSummary {
  input_tokens: number
  output_tokens: number
  reasoning_tokens?: number
  estimated_cost_usd?: number
  currency?: string
}

export interface ToolCallStats {
  name: string
  count: number
  success: number
  failed: number
}

export interface ToolSummary {
  total_calls: number
  success: number
  failed: number
  by_tool: ToolCallStats[]
}

export interface AnalysisResult {
  id: string
  timestamp: string
  duration_ms: number
  protocol: string // "anthropic" | "openai" | "unknown"
  stream: boolean
  model: string
  timeline: TimelineStep[]
  usage?: UsageSummary
  tools?: ToolSummary
  stop_reason: string
  parse_error?: string
}

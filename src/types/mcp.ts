// MCP Server management (/admin/api/mcp/*)
// Mirrors backend internal/mcp/model.go.

export type McpTransportType = 'http' | 'sse' | 'stdio'
export type McpAuthType = 'none' | 'bearer' | 'basic' | 'oauth2' | 'sigv4'
export type McpPrincipalType = 'key' | 'team' | 'role'

export interface McpStdioConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
}

/** auth_config shape varies by auth_type; kept loose since the backend
 *  encrypts on write and sanitizes to null on read. */
export type McpAuthConfig = Record<string, unknown>

export interface McpServer {
  id: number
  org_id?: number | null
  name: string
  display_name: string
  description: string
  transport_type: McpTransportType
  url: string
  stdio_config: McpStdioConfig | null
  // Sanitized to null on list/get responses (sensitive).
  auth_config: McpAuthConfig | null
  custom_headers: Record<string, string> | null
  auth_type: McpAuthType
  status: number // 1=active, 0=inactive, -1=error
  health_status: number // 1=healthy, 0=unknown, -1=unhealthy
  last_health_check: string | null
  tool_count: number
  enabled: boolean
  tier_required?: string
  created_by?: number
  created_at: string
  updated_at: string
}

export interface McpServerCreateRequest {
  name: string
  display_name?: string
  description?: string
  transport_type: McpTransportType
  url?: string
  stdio_config?: McpStdioConfig
  auth_type?: McpAuthType
  auth_config?: McpAuthConfig
  custom_headers?: Record<string, string>
  enabled?: boolean
}

export type McpServerUpdateRequest = Partial<McpServerCreateRequest>

export interface McpServerTestResult {
  healthy: boolean
  error?: string
}

// Tools returned by the upstream tools/list — shape is opaque, so keep it loose.
export interface McpTool {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
  [key: string]: unknown
}

export interface McpServerPermission {
  id: number
  server_id: number
  principal_type: McpPrincipalType
  principal_id: number
  allow_tools: string[]
  deny_tools: string[]
  created_at: string
}

export interface McpPermissionCreateRequest {
  principal_type: McpPrincipalType
  principal_id: number
  allow_tools?: string[]
  deny_tools?: string[]
}

export type McpLogStatus = 1 | 0 | -1 // success | error | blocked

export interface McpToolCallLog {
  id: number
  org_id?: number | null
  request_id: string
  server_id: number
  server_name: string
  tool_name: string
  method: string
  input_size: number
  output_size: number
  duration: number // ms
  status: McpLogStatus
  error_code: number
  error_msg: string
  api_key_id: number
  user_id: number
  team_id: number
  blocked_by: string
  created_at: string
}

export interface McpToolCallStats {
  total_calls: number
  success_count: number
  error_count: number
  blocked_count: number
  avg_duration_ms: number
  p95_duration_ms: number
  total_input_bytes: number
  total_output_bytes: number
}

export interface McpTopTool {
  name: string
  count: number
  avg_duration_ms: number
  error_rate: number // 0-1
}

export interface McpDailyCalls {
  date: string
  count: number
  success: number
  error: number
}

export interface McpServerStats {
  stats: McpToolCallStats
  top_tools: McpTopTool[]
  calls_by_day: McpDailyCalls[]
  days: number
}

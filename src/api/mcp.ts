import { get, post, put, del } from './interceptor'
import type { Pagination } from '@/types'
import type {
  McpServer,
  McpServerCreateRequest,
  McpServerUpdateRequest,
  McpServerTestResult,
  McpTool,
  McpServerPermission,
  McpPermissionCreateRequest,
  McpToolCallLog,
  McpServerStats,
} from '@/types'

export interface McpLogQuery {
  page?: number
  page_size?: number
}

export const mcpApi = {
  // Servers
  list: () => get<McpServer[]>('/mcp/servers'),
  detail: (id: number) => get<McpServer>(`/mcp/servers/${id}`),
  create: (data: McpServerCreateRequest) => post<McpServer>('/mcp/servers', data),
  update: (id: number, data: McpServerUpdateRequest) => put<McpServer>(`/mcp/servers/${id}`, data),
  delete: (id: number) => del<void>(`/mcp/servers/${id}`),
  test: (id: number) => post<McpServerTestResult>(`/mcp/servers/${id}/test`),

  // Tools (read-only, discovered from upstream)
  tools: (id: number) => get<McpTool[]>(`/mcp/servers/${id}/tools`),

  // Permissions
  listPermissions: (id: number) => get<McpServerPermission[]>(`/mcp/servers/${id}/permissions`),
  createPermission: (id: number, data: McpPermissionCreateRequest) =>
    post<McpServerPermission>(`/mcp/servers/${id}/permissions`, data),
  deletePermission: (id: number, pid: number) => del<void>(`/mcp/servers/${id}/permissions/${pid}`),

  // Logs (server-side paginated)
  logs: (id: number, params: McpLogQuery) =>
    get<McpToolCallLog[]>(`/mcp/servers/${id}/logs`, params as Record<string, unknown>),

  // Stats
  stats: (id: number, days = 7) => get<McpServerStats>(`/mcp/servers/${id}/stats`, { days }),
}

// Re-export for call sites that need the paginated wrapper shape.
export type { Pagination }

import { get, del } from './interceptor'
import type { DebugEntrySummary, DebugEntryDetail, AnalysisResult } from '@/types'

export const debugApi = {
  // GET /debug/entries — newest first, in-memory ring buffer (max 100)
  list: () => get<DebugEntrySummary[]>('/debug/entries'),
  // GET /debug/entries/:id — full req/resp + upstream call chain
  detail: (id: string) => get<DebugEntryDetail>(`/debug/entries/${id}`),
  // GET /debug/entries/:id/analysis — Pro only; conversation timeline/usage/tools
  analysis: (id: string) => get<AnalysisResult>(`/debug/entries/${id}/analysis`),
  // DELETE /debug/entries — clear captured entries (org-scoped)
  clear: () => del<{ message: string }>('/debug/entries'),
}

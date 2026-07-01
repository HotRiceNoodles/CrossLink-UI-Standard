import { get, del } from './interceptor'
import type { DebugEntrySummary, DebugEntryDetail, AnalysisResult } from '@/types'

export const debugApi = {
  // GET /debug/entries — newest first, in-memory ring buffer (max 100)
  list: () => get<DebugEntrySummary[]>('/debug/entries'),
  // GET /debug/entries/:seq — full req/resp + upstream call chain
  detail: (seq: number | string) => get<DebugEntryDetail>(`/debug/entries/${seq}`),
  // GET /debug/entries/:seq/analysis — Pro only; conversation timeline/usage/tools
  analysis: (seq: number | string) => get<AnalysisResult>(`/debug/entries/${seq}/analysis`),
  // DELETE /debug/entries — clear captured entries (org-scoped)
  clear: () => del<{ message: string }>('/debug/entries'),
}

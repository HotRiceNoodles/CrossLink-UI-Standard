import request, { get, del, put } from './interceptor'
import type { DebugEntrySummary, DebugEntryDetail, AnalysisResult, DebugConfig } from '@/types'

export const debugApi = {
  // GET /debug/entries — newest first, in-memory ring buffer (max 100)
  list: () => get<DebugEntrySummary[]>('/debug/entries'),
  // GET /debug/entries/:seq — full req/resp + upstream call chain
  detail: (seq: number | string) => get<DebugEntryDetail>(`/debug/entries/${seq}`),
  // GET /debug/entries/:seq/analysis — Pro only; conversation timeline/usage/tools
  analysis: (seq: number | string) => get<AnalysisResult>(`/debug/entries/${seq}/analysis`),
  // DELETE /debug/entries — clear captured entries (org-scoped)
  clear: () => del<{ message: string }>('/debug/entries'),

  // GET /debug/config — 采样四元组（enabled/sampling_rate/only_failed 可改；
  // capacity/max_body_size 只读）
  getConfig: () => get<DebugConfig>('/debug/config'),
  // PUT /debug/config — 三字段全部必填，热生效并持久化（需 debug:clear）
  updateConfig: (data: { enabled: boolean; sampling_rate: number; only_failed: boolean }) =>
    put<DebugConfig>('/debug/config', data),

  /**
   * POST /debug/entries/:seq/replay — re-send the captured request through the
   * full gateway chain as the given key (quota is consumed). The backend
   * response is a TRANSPARENT passthrough (status + content-type + raw body),
   * not the usual {data} envelope — so this needs the raw axios call, and
   * validateStatus keeps gateway 4xx/5xx reachable for display instead of
   * turning them into thrown errors.
   */
  replay: (
    seq: number | string,
    keyId: number,
    overrides?: Record<string, unknown>,
  ): Promise<{ status: number; body: unknown }> =>
    request
      .post(
        `/debug/entries/${seq}/replay`,
        {
          key_id: keyId,
          overrides: overrides ?? {},
        },
        { validateStatus: () => true },
      )
      .then((res) => ({ status: res.status, body: res.data })),
}

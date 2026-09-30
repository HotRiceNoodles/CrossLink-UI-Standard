import { get, put } from './interceptor'
import type { SystemConfigResponse, SystemConfigUpdateResponse } from '@/types'

export const systemConfigApi = {
  get: () => get<SystemConfigResponse>('/system/config'),
  // Sparse update: only changed keys; null deletes the row (revert to
  // bootstrap default); empty string on a sensitive key clears it.
  // Unlike GET, the PUT response is flat ({message, applied, deleted,
  // restart_required_applied}) — no ApiResponse envelope — so unwrap via cast.
  update: async (data: Record<string, unknown>): Promise<SystemConfigUpdateResponse> => {
    const res = await put<null>('/system/config', data)
    return res as unknown as SystemConfigUpdateResponse
  },
}

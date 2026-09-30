import { get, put } from './interceptor'
import type { SystemConfigResponse, SystemConfigUpdateResponse } from '@/types'

export const systemConfigApi = {
  get: () => get<SystemConfigResponse>('/system/config'),
  // Sparse update: only changed keys; null deletes the row (revert to
  // bootstrap default); empty string on a sensitive key clears it.
  update: (data: Record<string, unknown>) =>
    put<SystemConfigUpdateResponse>('/system/config', data),
}

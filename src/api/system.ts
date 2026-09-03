import request, { get, post } from './interceptor'
import type { SystemInfo } from '@/types'

export const systemApi = {
  info: () => get<SystemInfo>('/system/info'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    post<null>('/system/password', data),
  // GET /version 响应为裸 JSON {version}，不包统一 data 壳，走原始 axios 实例
  getBackendVersion: () => request.get<{ version: string }>('/version').then((r) => r.data.version),
}

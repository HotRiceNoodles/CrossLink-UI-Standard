import request, { get, post } from './interceptor'
import type { GatewayCapabilities, SystemInfo } from '@/types'

export const systemApi = {
  // 运行中网关准入的协议能力（beta tokens / 方言扩展参数 / effort 支持的 api_versions）
  gatewayCapabilities: () => get<GatewayCapabilities>('/gateway/capabilities'),

  info: () => get<SystemInfo>('/system/info'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    post<null>('/system/password', data),
  // GET /version 响应为裸 JSON {version}，不包统一 data 壳，走原始 axios 实例
  getBackendVersion: () => request.get<{ version: string }>('/version').then((r) => r.data.version),
}

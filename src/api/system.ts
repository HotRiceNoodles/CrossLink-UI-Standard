import request, { get, post } from './interceptor'
import type { GatewayCapabilities, InstallSummaryItem, SystemInfo } from '@/types'

export const systemApi = {
  // 运行中网关准入的协议能力（beta tokens / 方言扩展参数 / effort 支持的 api_versions）
  gatewayCapabilities: () => get<GatewayCapabilities>('/gateway/capabilities'),

  info: () => get<SystemInfo>('/system/info'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    post<null>('/system/password', data),
  // 安装期参数摘要（首装锁定项：币种/加密/JWT 等，只读）
  installSummary: () => get<InstallSummaryItem[]>('/system/install-summary'),

  // GET /version 响应为裸 JSON {version}，不包统一 data 壳，走原始 axios 实例
  getBackendVersion: () => request.get<{ version: string }>('/version').then((r) => r.data.version),
}

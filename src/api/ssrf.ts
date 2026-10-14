import request, { get, post } from './interceptor'
import type { SsrfAllowlistStatus, SsrfApplyResult, SsrfReauthResponse } from '@/types'

/**
 * SSRF 内网 allowlist（B5）。
 *
 * 写操作是敏感操作：先 POST /reauth（输入当前账号密码）换取单次短时令牌，
 * 再以 X-Reauth-Token 头执行 PUT/DELETE。令牌一次性、绑定用户与会话指纹，
 * 因此每次保存/删除前都要重新走一遍 reauth，不做缓存。
 */
export const ssrfApi = {
  status: () => get<SsrfAllowlistStatus>('/system/ssrf-allowlist'),

  reauth: (password: string) =>
    post<SsrfReauthResponse>('/system/ssrf-allowlist/reauth', { password }),

  /**
   * 覆盖 allowlist。cidrs 必填：显式空数组 = 「严格拒绝所有内网目标」；
   * 要删除页面覆盖请用 reset（回退 env > YAML > strict）。
   * expected_version 为 CAS 版本，来自 status().version；并发修改返回 409 conflict。
   */
  apply: (cidrs: string[], expectedVersion: number, reauthToken: string) =>
    request
      .put<{ data: SsrfApplyResult }>(
        '/system/ssrf-allowlist',
        {
          cidrs,
          expected_version: expectedVersion,
        },
        { headers: { 'X-Reauth-Token': reauthToken } },
      )
      .then((res) => res.data),

  /** 删除页面覆盖（墓碑保留、版本单调递增；expected_version 0 幂等成功） */
  reset: (expectedVersion: number, reauthToken: string) =>
    request
      .delete<{ data: SsrfApplyResult }>('/system/ssrf-allowlist', {
        data: { expected_version: expectedVersion },
        headers: { 'X-Reauth-Token': reauthToken },
      })
      .then((res) => res.data),
}

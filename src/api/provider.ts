import { get, post, put, del } from './interceptor'
import type {
  Provider,
  ProviderCreateRequest,
  Adapter,
  ProviderCircuits,
  RemoteModelsResult,
} from '@/types'

export interface TestResult {
  success: boolean
  error?: string
  latency_ms?: number
  model?: string
}

export const providerApi = {
  list: () => get<Provider[]>('/providers'),
  create: (data: ProviderCreateRequest) => post<Provider>('/providers', data),
  update: (id: number, data: Partial<ProviderCreateRequest>) =>
    put<Provider>(`/providers/${id}`, data),
  delete: (id: number) => del<void>(`/providers/${id}`),
  test: (id: number, model?: string) =>
    post<TestResult>(`/providers/${id}/test`, model ? { model } : undefined),

  // 活跃熔断快照（open/half_open；closed 是常态不返回）
  circuits: () => get<ProviderCircuits>('/providers/health'),
  // 管理员强制闭合电路（绕过冷却；下一次真实失败会立刻重新打开）
  resetCircuit: (provider: string, model: string) =>
    post<{ reset: boolean; provider: string; model: string }>('/providers/health/reset', {
      provider,
      model,
    }),

  // 保存态供应商的远端模型目录（服务端解析已存密钥；失败也返回 200）
  remoteModels: (id: number) => post<RemoteModelsResult>(`/providers/${id}/models/remote`),
  adapters: async () => {
    const res = await get<Record<string, unknown>[]>('/adapters')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapters = (res.data ?? []).map((item: any) => ({
      type: item.type as string,
      display_name: (item.meta?.display_name as string) ?? (item.type as string),
      description: (item.meta?.description as string) ?? '',
      needs_base_url: (item.meta?.needs_base_url as boolean) ?? true,
      needs_api_key: (item.meta?.needs_api_key as boolean) ?? true,
      base_url_default: (item.meta?.base_url_default as string) ?? '',
      protocol_base_urls: (item.meta?.protocol_base_urls as Record<string, string>) ?? {},
      capabilities: (item.meta?.capabilities as string[]) ?? [],
      extra_fields: (item.meta?.extra_fields as Adapter['extra_fields']) ?? [],
      minimum_tier: (item.meta?.minimum_tier as string) ?? '',
    }))
    return { ...res, data: adapters }
  },
}

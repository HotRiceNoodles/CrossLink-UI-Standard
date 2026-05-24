import { get, post, put, del } from './interceptor'
import type { Provider, ProviderCreateRequest, Adapter } from '@/types'

export const providerApi = {
  list: () => get<Provider[]>('/providers'),
  create: (data: ProviderCreateRequest) => post<Provider>('/providers', data),
  update: (id: number, data: Partial<ProviderCreateRequest>) => put<Provider>(`/providers/${id}`, data),
  delete: (id: number) => del<void>(`/providers/${id}`),
  test: (id: number) => post<{ success: boolean; message: string }>(`/providers/${id}/test`),
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

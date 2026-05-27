import { get, post, put, del } from './interceptor'
import type { APIKey, KeyCreateRequest, KeyCreateResponse } from '@/types'

export const keyApi = {
  list: () => get<APIKey[]>('/keys'),
  create: (data: KeyCreateRequest) => post<KeyCreateResponse>('/keys', data),
  update: (id: number, data: Partial<KeyCreateRequest & { status?: number }>) =>
    put<void>(`/keys/${id}`, data),
  delete: (id: number) => del<void>(`/keys/${id}`),
  regenerate: (id: number) => post<KeyCreateResponse>(`/keys/${id}/regenerate`),
}

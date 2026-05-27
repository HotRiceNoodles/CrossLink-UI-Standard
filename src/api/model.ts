import { get, post, put, del } from './interceptor'
import type { ProviderModel, ModelCreateRequest } from '@/types'

export const modelApi = {
  list: () => get<ProviderModel[]>('/models'),
  create: (data: ModelCreateRequest) => post<ProviderModel>('/models', data),
  update: (id: number, data: Partial<ModelCreateRequest>) =>
    put<ProviderModel>(`/models/${id}`, data),
  delete: (id: number) => del<void>(`/models/${id}`),
}

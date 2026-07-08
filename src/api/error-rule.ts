import { get, post, put, del } from './interceptor'
import type { ErrorRule, ErrorRuleCreateRequest } from '@/types'

export const errorRuleApi = {
  list: () => get<ErrorRule[]>('/error-rules'),
  create: (data: ErrorRuleCreateRequest) => post<ErrorRule>('/error-rules', data),
  update: (id: number, data: Partial<ErrorRuleCreateRequest>) =>
    put<ErrorRule>(`/error-rules/${id}`, data),
  delete: (id: number) => del<void>(`/error-rules/${id}`),
}

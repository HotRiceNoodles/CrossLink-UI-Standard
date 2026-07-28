import { get, post, put, del } from './interceptor'
import type {
  PromptTemplate,
  PromptTemplateCreateRequest,
  PromptTemplateUpdateRequest,
  RenderedContext,
} from '@/types'

export const templateApi = {
  list: () => get<PromptTemplate[]>('/templates'),
  detail: (id: number) => get<PromptTemplate>(`/templates/${id}`),
  create: (data: PromptTemplateCreateRequest) => post<PromptTemplate>('/templates', data),
  update: (id: number, data: PromptTemplateUpdateRequest) =>
    put<PromptTemplate>(`/templates/${id}`, data),
  delete: (id: number) => del<void>(`/templates/${id}`),
  // preview 不调用上游 LLM；variables 可为空对象。
  preview: (id: number, variables: Record<string, unknown>) =>
    post<RenderedContext>(`/templates/${id}/preview`, { variables }),
}

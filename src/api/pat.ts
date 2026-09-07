import { get, post, del } from './interceptor'
import type { PatToken, PatCreateResponse } from '@/types'

export const patApi = {
  list: () => get<PatToken[]>('/pats'),
  create: (data: { name: string; scopes: string[] }) => post<PatCreateResponse>('/pats', data),
  revoke: (id: number) => del<null>(`/pats/${id}`), // 响应为 {message} 无 data
}

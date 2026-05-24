import { get, post } from './interceptor'
import type { LoginRequest, LoginResponse } from '@/types'

export const authApi = {
  login: (data: LoginRequest) => post<LoginResponse>('/auth/login', data),
  logout: () => post<void>('/auth/logout'),
  permissions: () => get<{ permissions: string[]; tier: string }>('/auth/permissions'),
}

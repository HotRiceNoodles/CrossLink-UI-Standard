import { get, post } from './interceptor'
import type { LoginRequest, LoginResponse, SwitchOrgResponse, User } from '@/types'

export const authApi = {
  login: (data: LoginRequest) => post<LoginResponse>('/auth/login', data),
  logout: () => post<void>('/auth/logout'),
  permissions: () => get<{ permissions: string[]; tier: string; user: User }>('/auth/permissions'),
  switchOrg: (data: { org_id: number }) => post<SwitchOrgResponse>('/auth/switch-org', data),
}

import { get, post } from './interceptor'
import type { LoginRequest, LoginResponse, SwitchOrgResponse } from '@/types'

export const authApi = {
  login: (data: LoginRequest) => post<LoginResponse>('/auth/login', data),
  logout: () => post<void>('/auth/logout'),
  permissions: () => get<{ permissions: string[]; tier: string }>('/auth/permissions'),
  switchOrg: (data: { org_id: number }) => post<SwitchOrgResponse>('/auth/switch-org', data),
  changeForcedPassword: (data: { new_password: string; confirm_password: string }) =>
    post<LoginResponse>('/auth/change-forced-password', data),
}

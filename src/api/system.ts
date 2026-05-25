import { get, post } from './interceptor'
import type { SystemInfo } from '@/types'

export const systemApi = {
  info: () => get<SystemInfo>('/system/info'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    post<null>('/system/password', data),
}

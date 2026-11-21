import { get, put } from './interceptor'
import type { UserProfile, UserProfileUpdateRequest } from '@/types'

/**
 * 个人中心自助资料（GET/PUT /user/profile，2026-11 后端新增）。
 * 只开放 display_name/email 自助修改；角色/组织/状态属管理面语义，不在此通道。
 */
export const profileApi = {
  get: () => get<UserProfile>('/user/profile'),
  update: (data: UserProfileUpdateRequest) => put<UserProfile>('/user/profile', data),
}

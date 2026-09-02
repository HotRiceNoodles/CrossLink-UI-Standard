import { get, post, put } from './interceptor'
import type { ContentLogSetting, SystemSettings } from '@/types'

export const settingsApi = {
  // 内容日志 — 社区版可用的专用端点
  getContentLog: () => get<ContentLogSetting>('/system/content-log'),
  updateContentLog: (enabled: boolean) => put<null>('/system/content-log', { enabled }),
  // 聚合系统设置 — Pro 专属（如 debug_mode，见 request-debug 页）
  getSettings: () => get<SystemSettings>('/system/settings'),
  updateSettings: (data: Partial<SystemSettings>) => post<SystemSettings>('/system/settings', data),
}

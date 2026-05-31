import { get, post } from './interceptor'
import type { SystemSettings } from '@/types'

export const settingsApi = {
  getSettings: () => get<SystemSettings>('/system/settings'),
  updateSettings: (data: Partial<SystemSettings>) => post<SystemSettings>('/system/settings', data),
}

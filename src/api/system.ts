import { get } from './interceptor'
import type { SystemInfo } from '@/types'

export const systemApi = {
  info: () => get<SystemInfo>('/system/info'),
}

import { get } from './interceptor'
import type { LicenseStatus } from '@/types'

export const licenseApi = {
  status: () => get<LicenseStatus>('/license/status'),
}

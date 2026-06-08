import { get, post } from './interceptor'
import request from './interceptor'
import type { LicenseStatus } from '@/types'

export const licenseApi = {
  status: () => get<LicenseStatus>('/license/status'),

  // 在线激活 — 后端接收 { license_key: string }，返回 LicenseStatus
  activate: (licenseKey: string) =>
    post<LicenseStatus>('/license/activate', { license_key: licenseKey }),

  // 离线导入 — 上传 .lic 文件（multipart/form-data），返回 LicenseStatus
  importLic: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/license/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

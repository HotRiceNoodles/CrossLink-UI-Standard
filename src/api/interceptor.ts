import axios from 'axios'
import { clearToken, getToken } from '@/utils/auth'
import type { ApiResponse } from '@/types'
import { logger } from '@/logger/core'

const request = axios.create({
  baseURL: '/admin/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
})

request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      // 延迟导入避免循环依赖，由 router guard 处理跳转
      import('@/router').then(({ default: router }) => {
        router.push({ name: 'login' })
      })
    }

    // Handle force_password_change: backend blocks all requests except the change-password endpoint
    if (error.response?.status === 403 && error.response?.data?.code === 'force_password_change') {
      // Token is still valid for the forced-password endpoint — don't clear it
      import('@/router').then(({ default: router }) => {
        router.push({ name: 'login', query: { force_change: 'true' } })
      })
      return Promise.reject(error)
    }
    // Logger: API 错误日志
    const status = error.response?.status
    const method = error.config?.method?.toUpperCase()
    const url = error.config?.url

    if (status === 401) {
      logger.warn(`API 认证失败: ${method} ${url}`, { status }, 'axios')
    } else if (status && status >= 500) {
      logger.error(
        `API 服务端错误: ${method} ${url} ${status}`,
        {
          error: error,
          status,
          data: error.response?.data,
        },
        'axios',
      )
    } else if (status && status >= 400) {
      logger.warn(`API 客户端错误: ${method} ${url} ${status}`, { error: error, status }, 'axios')
    } else {
      logger.error(`API 网络错误: ${method} ${url}`, { error: error }, 'axios')
    }
    return Promise.reject(error)
  },
)

export async function get<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  const res = await request.get(url, { params })
  return res.data
}

export async function post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const res = await request.post(url, data)
  return res.data
}

export async function put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const res = await request.put(url, data)
  return res.data
}

export async function del<T>(url: string): Promise<ApiResponse<T>> {
  const res = await request.delete(url)
  return res.data
}

export function createCancellableRequest<T>(apiCall: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController()
  return {
    request: apiCall(controller.signal),
    cancel: () => controller.abort(),
  }
}

export default request

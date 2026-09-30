import { get } from './interceptor'
import type { ReadinessReport } from '@/types'

export const readinessApi = {
  // Config doctor — self-service, no RequireAction on the backend.
  get: () => get<ReadinessReport>('/system/readiness'),
}

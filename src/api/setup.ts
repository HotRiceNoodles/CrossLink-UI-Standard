import { post } from './interceptor'
import type { SetupApplyRequest, SetupApplyResponse } from '@/types'

export const setupApi = {
  apply: (data: SetupApplyRequest) => post<SetupApplyResponse>('/system/setup/apply', data),
  skip: () => post<null>('/system/setup/skip'),
}

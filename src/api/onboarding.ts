import { post } from './interceptor'
import type { ProbeRequest, ProbeResult, OnboardingRequest, OnboardingResult } from '@/types'

/**
 * Onboarding 向导 API。
 *
 * probe 始终返回 200（失败也 200 + success:false），不会触发 axios 的 401/403 拦截。
 * commit 成功 201；失败（含 provider 名冲突 409）走标准错误体 { error, error_code }。
 */
export const onboardingApi = {
  probe: (data: ProbeRequest) => post<ProbeResult>('/providers/probe', data),
  commit: (data: OnboardingRequest) => post<OnboardingResult>('/system/onboarding', data),
}

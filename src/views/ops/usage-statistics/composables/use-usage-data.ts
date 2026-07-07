import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { usageApi } from '@/api/usage'
import { useRange } from '@/views/dashboard/composables/use-range'
import type { UsageStats, DailyTrend, ModelDistribution, TeamStat, UsageQuery } from '@/types'

const EMPTY_STATS: UsageStats = {
  total_requests: 0,
  total_tokens: 0,
  total_cost: 0,
  avg_latency_ms: 0,
  cost_by_currency: {},
}

/**
 * 用量统计页数据层：维护过滤状态，把单个 range 预设同时映射成
 *  - `days` 给 /usage/daily、/usage/models、/usage/team-stats
 *  - `{ start_date, end_date }` 给 /usage/stats
 * 并并行拉取 4 个聚合端点。失败用 Message 提示，部分成功也保留已有数据。
 */
export function useUsageData(tFail: () => string) {
  const { range, days, dateBounds } = useRange('7d')

  const filter = reactive({
    model: undefined as string | undefined,
    provider_id: undefined as number | undefined,
    team_id: undefined as number | undefined,
    api_key_id: undefined as number | undefined,
    status: undefined as string | undefined,
    has_fallback: undefined as boolean | undefined,
  })

  const stats = ref<UsageStats>({ ...EMPTY_STATS })
  const daily = ref<DailyTrend[]>([])
  const models = ref<ModelDistribution[]>([])
  const teams = ref<TeamStat[]>([])

  const loading = ref(false)
  const trendCurrency = ref('CNY')
  const teamCurrency = ref('CNY')

  /** 公共过滤参数（不含分页、不含时间）。 */
  function commonParams(): UsageQuery {
    const p: UsageQuery = {}
    if (filter.model) p.model = filter.model
    if (filter.provider_id != null) p.provider_id = filter.provider_id
    if (filter.team_id != null) p.team_id = filter.team_id
    if (filter.api_key_id != null) p.api_key_id = filter.api_key_id
    if (filter.status) p.status = filter.status
    if (filter.has_fallback != null) p.has_fallback = filter.has_fallback
    return p
  }

  async function fetchAll() {
    loading.value = true
    try {
      const common = commonParams()
      const [statsRes, dailyRes, modelsRes, teamsRes] = await Promise.allSettled([
        usageApi.stats({ ...common, ...dateBounds.value }),
        usageApi.daily({ ...common, days: days.value }),
        usageApi.models({ ...common, days: days.value }),
        usageApi.teamStats({ ...common, days: days.value }),
      ])

      if (statsRes.status === 'fulfilled') stats.value = statsRes.value.data
      if (dailyRes.status === 'fulfilled') {
        daily.value = dailyRes.value.data
        trendCurrency.value =
          (dailyRes.value as { currency?: string }).currency || trendCurrency.value
      }
      if (modelsRes.status === 'fulfilled') models.value = modelsRes.value.data
      if (teamsRes.status === 'fulfilled') {
        teams.value = teamsRes.value.data
        teamCurrency.value =
          (teamsRes.value as { currency?: string }).currency || teamCurrency.value
      }

      // 全部失败才提示；部分失败时已有数据继续展示
      const allFailed = [statsRes, dailyRes, modelsRes, teamsRes].every(
        (r) => r.status === 'rejected',
      )
      if (allFailed) Message.error(tFail())
    } finally {
      loading.value = false
    }
  }

  function resetFilter() {
    filter.model = undefined
    filter.provider_id = undefined
    filter.team_id = undefined
    filter.api_key_id = undefined
    filter.status = undefined
    filter.has_fallback = undefined
    range.value = '7d'
  }

  return {
    range,
    days,
    filter,
    stats,
    daily,
    models,
    teams,
    loading,
    trendCurrency,
    teamCurrency,
    fetchAll,
    resetFilter,
  }
}

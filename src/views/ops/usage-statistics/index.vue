<template>
  <div class="usage-stat-page">
    <a-card class="general-card">
      <template #title>
        <div class="page-head">
          <span class="page-title">{{ t('usageStat.title') }}</span>
          <span class="page-subtitle">{{ t('usageStat.subtitle') }}</span>
        </div>
      </template>

      <!-- Filter bar -->
      <div class="filter-area">
        <a-row :gutter="12" align="center">
          <a-col :span="6">
            <div class="filter-item">
              <label class="filter-label">{{ t('usageStat.range') }}</label>
              <a-radio-group v-model="range" type="button" size="small" style="width: 100%">
                <a-radio v-for="opt in RANGE_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ t(opt.labelKey) }}
                </a-radio>
              </a-radio-group>
            </div>
          </a-col>
          <a-col :span="5">
            <div class="filter-item">
              <label class="filter-label">{{ t('ops.model') }}</label>
              <a-select
                v-model="filter.model"
                :placeholder="t('common.all')"
                allow-search
                allow-clear
                style="width: 100%"
              >
                <a-option v-for="m in modelOptions" :key="m" :value="m" :label="m" />
              </a-select>
            </div>
          </a-col>
          <a-col :span="4">
            <div class="filter-item">
              <label class="filter-label">{{ t('ops.provider') }}</label>
              <a-select
                v-model="filter.provider_id"
                :placeholder="t('common.all')"
                allow-clear
                style="width: 100%"
              >
                <a-option
                  v-for="p in providerOptions"
                  :key="p.value"
                  :value="p.value"
                  :label="p.label"
                />
              </a-select>
            </div>
          </a-col>
          <a-col :span="4">
            <div class="filter-item">
              <label class="filter-label">{{ t('ops.apiKey') }}</label>
              <a-select
                v-model="filter.api_key_id"
                :placeholder="t('common.all')"
                allow-clear
                allow-search
                style="width: 100%"
              >
                <a-option
                  v-for="k in keyOptions"
                  :key="k.value"
                  :value="k.value"
                  :label="k.label"
                />
              </a-select>
            </div>
          </a-col>
          <a-col :span="5">
            <div class="filter-item filter-actions">
              <label class="filter-label">&nbsp;</label>
              <a-space>
                <a-button type="primary" @click="fetchAll">{{ t('common.search') }}</a-button>
                <a-button @click="onReset">{{ t('common.reset') }}</a-button>
              </a-space>
            </div>
          </a-col>
        </a-row>

        <transition name="slide-down">
          <a-row v-if="advancedVisible" :gutter="12" align="center" class="advanced-row">
            <a-col v-if="teamOptions.length" :span="5">
              <div class="filter-item">
                <label class="filter-label">{{ t('usageStat.team') }}</label>
                <a-select
                  v-model="filter.team_id"
                  :placeholder="t('common.all')"
                  allow-clear
                  style="width: 100%"
                >
                  <a-option
                    v-for="tm in teamOptions"
                    :key="tm.value"
                    :value="tm.value"
                    :label="tm.label"
                  />
                </a-select>
              </div>
            </a-col>
            <a-col :span="4">
              <div class="filter-item">
                <label class="filter-label">{{ t('ops.statusCode') }}</label>
                <a-select
                  v-model="filter.status"
                  :placeholder="t('common.all')"
                  allow-clear
                  style="width: 100%"
                >
                  <a-option value="2xx" label="2xx" />
                  <a-option value="4xx" label="4xx" />
                  <a-option value="5xx" label="5xx" />
                  <a-option value="429" label="429" />
                </a-select>
              </div>
            </a-col>
            <a-col :span="4">
              <div class="filter-item">
                <label class="filter-label">{{ t('ops.fallback') }}</label>
                <a-select
                  v-model="filter.has_fallback"
                  :placeholder="t('common.all')"
                  allow-clear
                  style="width: 100%"
                >
                  <a-option :value="true" :label="t('common.yes')" />
                  <a-option :value="false" :label="t('common.no')" />
                </a-select>
              </div>
            </a-col>
          </a-row>
        </transition>

        <a-link class="advanced-toggle" @click="advancedVisible = !advancedVisible">
          {{ advancedVisible ? t('ops.collapseFilter') : t('ops.advancedFilter') }}
          <template #icon>
            <icon-up v-if="advancedVisible" />
            <icon-down v-else />
          </template>
        </a-link>
      </div>
    </a-card>

    <a-spin :loading="loading" style="width: 100%; display: block">
      <div class="stat-body">
        <!-- KPI -->
        <KpiCards :stats="stats" />

        <!-- Trend -->
        <UsageTrendChart :data="daily" :currency="trendCurrency" class="section" />

        <!-- Distribution tables -->
        <a-grid :cols="24" :col-gap="16" :row-gap="16" class="section">
          <a-grid-item :span="12">
            <DistributionTable
              :title="t('dashboard.modelDistribution')"
              :rows="modelRows"
              :name-label="t('usageStat.colModel')"
              :currency="stats.currency"
            />
          </a-grid-item>
          <a-grid-item :span="12">
            <DistributionTable
              :title="t('dashboard.topTeams')"
              :rows="teamRows"
              :name-label="t('usageStat.colTeam')"
              :currency="teamCurrency"
            />
          </a-grid-item>
        </a-grid>

        <!-- Provider routing drill-down (single model: configured weight vs actual) -->
        <RoutingPanel
          class="section"
          :days="days"
          :model-options="modelOptions"
          :currency="stats.currency"
          :initial-model="filter.model"
        />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { modelApi } from '@/api/model'
import { providerApi } from '@/api/provider'
import { keyApi } from '@/api/key'
import { teamApi } from '@/api/rbac'
import { RANGE_OPTIONS } from '@/views/dashboard/composables/use-range'
import { logger } from '@/logger'
import KpiCards from './components/kpi-cards.vue'
import UsageTrendChart from './components/usage-trend-chart.vue'
import DistributionTable from './components/distribution-table.vue'
import RoutingPanel from './components/routing-panel.vue'
import { useUsageData } from './composables/use-usage-data'
import type { Provider, APIKey, Team } from '@/types'

defineOptions({ name: 'UsageStatistics' })

const { t } = useI18n()
const route = useRoute()
const {
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
} = useUsageData(() => t('usageStat.fetchFail'))

const advancedVisible = ref(false)

// filter dropdown options
const modelOptions = ref<string[]>([])
const providerOptions = ref<{ label: string; value: number }[]>([])
const keyOptions = ref<{ label: string; value: number }[]>([])
const teamOptions = ref<{ label: string; value: number }[]>([])

const modelRows = computed(() =>
  models.value.map((m) => ({ name: m.model, requests: m.count, tokens: m.tokens, cost: m.cost })),
)
const teamRows = computed(() =>
  teams.value.map((tm) => ({
    name: tm.team_name,
    requests: tm.total_requests,
    tokens: tm.total_tokens,
    cost: tm.total_cost,
  })),
)

async function loadFilterOptions() {
  // allSettled: 社区版未注册 /teams 等 RBAC 路由，单个失败不能拖垮其它下拉
  const [modelsRes, providersRes, keysRes, teamsRes] = await Promise.allSettled([
    modelApi.list(),
    providerApi.list(),
    keyApi.list(),
    teamApi.list(),
  ])

  if (modelsRes.status === 'fulfilled') {
    const modelSet = new Set<string>()
    for (const m of modelsRes.value.data ?? []) {
      if (m.model_name) modelSet.add(m.model_name)
    }
    modelOptions.value = Array.from(modelSet).sort()
  } else {
    logger.warn('Failed to load model filter options', modelsRes.reason, 'app')
  }

  if (providersRes.status === 'fulfilled') {
    providerOptions.value = ((providersRes.value.data as Provider[]) ?? []).map((p) => ({
      label: p.display_name || p.name,
      value: p.id,
    }))
  } else {
    logger.warn('Failed to load provider filter options', providersRes.reason, 'app')
  }

  if (keysRes.status === 'fulfilled') {
    keyOptions.value = ((keysRes.value.data as APIKey[]) ?? []).map((k) => ({
      label: k.name,
      value: k.id,
    }))
  } else {
    logger.warn('Failed to load key filter options', keysRes.reason, 'app')
  }

  if (teamsRes.status === 'fulfilled') {
    teamOptions.value = ((teamsRes.value.data as Team[]) ?? []).map((tm) => ({
      label: tm.display_name || tm.name,
      value: tm.id,
    }))
  }
  // teams 失败（社区版无 /teams 路由）静默处理：team 过滤项会因 teamOptions 为空而隐藏
}

function onReset() {
  resetFilter()
  fetchAll()
}

// 切换时间预设立即查询；其它筛选项仍由「查询」按钮显式触发
watch(range, () => fetchAll())

onMounted(() => {
  // Drill-down from dashboard top-models: ?model=<name> pre-fills the filter.
  const qModel = route.query.model
  if (typeof qModel === 'string' && qModel) filter.model = qModel
  fetchAll()
  loadFilterOptions()
})
</script>

<style scoped lang="less">
.usage-stat-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .page-title {
    font-size: 16px;
    font-weight: 600;
  }

  .page-subtitle {
    font-size: 12px;
    color: var(--color-text-3);
    font-weight: 400;
  }
}

.filter-area {
  .filter-item {
    .filter-label {
      display: block;
      font-size: 12px;
      color: var(--color-text-3);
      margin-bottom: 4px;
      line-height: 1;
    }
  }

  .filter-actions {
    display: flex;
    flex-direction: column;
  }

  .advanced-row {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--color-fill-3);
  }

  .advanced-toggle {
    display: inline-block;
    margin-top: 12px;
    font-size: 13px;
  }

  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .slide-down-enter-from,
  .slide-down-leave-to {
    opacity: 0;
    max-height: 0;
  }

  .slide-down-enter-to,
  .slide-down-leave-from {
    opacity: 1;
    max-height: 120px;
  }
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.section {
  margin-top: 4px;
}
</style>

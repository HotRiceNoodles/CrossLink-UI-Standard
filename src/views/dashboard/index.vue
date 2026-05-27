<template>
  <div class="dashboard-page">
    <a-spin :loading="loading" style="width: 100%">
      <div class="page-content">
        <!-- Welcome Banner -->
        <Banner :version="systemInfo?.version" :tier="license?.tier" />

        <!-- KPI Cards -->
        <DataPanel :stats="usageStats" />

        <!-- Charts Row -->
        <a-grid :cols="24" :col-gap="16" :row-gap="16" class="chart-section">
          <a-grid-item :span="14">
            <TrendChart :data="dailyTrend" />
          </a-grid-item>
          <a-grid-item :span="10">
            <ModelPie :data="modelDistribution" />
          </a-grid-item>
        </a-grid>

        <!-- System Info -->
        <SystemInfoCard v-if="systemInfo && license" :system-info="systemInfo" :license="license" />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usageApi } from '@/api/usage'
import { systemApi } from '@/api/system'
import { licenseApi } from '@/api/license'
import type {
  UsageStats,
  DailyTrend,
  ModelDistribution,
  SystemInfo as SystemInfoType,
  LicenseStatus,
} from '@/types'
import Banner from './components/banner.vue'
import DataPanel from './components/data-panel.vue'
import TrendChart from './components/trend-chart.vue'
import ModelPie from './components/model-pie.vue'
import SystemInfoCard from './components/system-info.vue'

const loading = ref(true)

const usageStats = ref<UsageStats>({
  total_requests: 0,
  total_tokens: 0,
  total_cost: 0,
  avg_latency: 0,
  cost_by_currency: {},
})

const dailyTrend = ref<DailyTrend[]>([])
const modelDistribution = ref<ModelDistribution[]>([])
const systemInfo = ref<SystemInfoType | null>(null)
const license = ref<LicenseStatus | null>(null)

async function fetchDashboardData() {
  loading.value = true
  try {
    const [statsRes, dailyRes, modelsRes, sysRes, licRes] = await Promise.allSettled([
      usageApi.stats(),
      usageApi.daily({ days: 7 }),
      usageApi.models({ days: 7 }),
      systemApi.info(),
      licenseApi.status(),
    ])

    if (statsRes.status === 'fulfilled') {
      usageStats.value = statsRes.value.data
    }
    if (dailyRes.status === 'fulfilled') {
      dailyTrend.value = dailyRes.value.data
    }
    if (modelsRes.status === 'fulfilled') {
      modelDistribution.value = modelsRes.value.data
    }
    if (sysRes.status === 'fulfilled') {
      systemInfo.value = sysRes.value.data
    }
    if (licRes.status === 'fulfilled') {
      license.value = licRes.value.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped lang="less">
.dashboard-page {
  padding: 0;
}

.page-content {
  display: flex;
  flex-direction: column;
}

.chart-section {
  margin-bottom: 16px;
}
</style>

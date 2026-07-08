<template>
  <div>
    <a-space style="margin-bottom: 16px">
      <a-radio-group v-model="days" type="button" @change="fetchStats">
        <a-radio :value="7">7d</a-radio>
        <a-radio :value="14">14d</a-radio>
        <a-radio :value="30">30d</a-radio>
      </a-radio-group>
      <a-button size="small" @click="fetchStats">
        <template #icon><icon-refresh /></template>
        {{ t('common.refresh') }}
      </a-button>
    </a-space>

    <a-spin :loading="loading" style="display: block">
      <template v-if="stats">
        <!-- KPI cards -->
        <a-grid
          :cols="{ xs: 2, sm: 4, md: 8 }"
          :col-gap="12"
          :row-gap="12"
          style="margin-bottom: 16px"
        >
          <a-grid-item v-for="kpi in kpiCards" :key="kpi.label">
            <a-card>
              <a-statistic :title="kpi.label" :value="kpi.value" :precision="kpi.precision">
                <template v-if="kpi.suffix" #suffix>{{ kpi.suffix }}</template>
              </a-statistic>
            </a-card>
          </a-grid-item>
        </a-grid>

        <!-- Trend chart -->
        <a-card v-if="trendLabels.length" class="general-card" style="margin-bottom: 16px">
          <template #title>{{ t('mcp.statsTrend') }} · {{ t('mcp.statsDays', [days]) }}</template>
          <Chart :option="trendOption" height="240px" width="100%" />
        </a-card>

        <!-- Top tools -->
        <a-card class="general-card">
          <template #title>{{ t('mcp.statsTopTools') }}</template>
          <a-empty v-if="!stats.top_tools.length" />
          <a-table
            v-else
            :data="stats.top_tools"
            :pagination="false"
            row-key="name"
            size="small"
            :bordered="false"
          >
            <template #columns>
              <a-table-column :title="t('mcp.statsToolName')" data-index="name" />
              <a-table-column
                :title="t('mcp.statsToolCount')"
                data-index="count"
                :width="120"
                align="right"
              />
              <a-table-column :title="t('mcp.statsToolAvgDuration')" :width="140" align="right">
                <template #cell="{ record }">{{ record.avg_duration_ms.toFixed(0) }} ms</template>
              </a-table-column>
              <a-table-column :title="t('mcp.statsToolErrorRate')" :width="120" align="right">
                <template #cell="{ record }">{{ (record.error_rate * 100).toFixed(1) }}%</template>
              </a-table-column>
            </template>
          </a-table>
        </a-card>
      </template>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import type { EChartsOption } from 'echarts'
import { mcpApi } from '@/api/mcp'
import Chart from '@/components/chart/index.vue'
import type { McpServerStats } from '@/types'

const props = defineProps<{ serverId: number }>()

const { t } = useI18n()
const stats = ref<McpServerStats | null>(null)
const loading = ref(false)
const days = ref(7)

async function fetchStats() {
  loading.value = true
  try {
    const res = await mcpApi.stats(props.serverId, days.value)
    stats.value = res.data
  } catch {
    Message.error(t('mcp.fetchFail'))
  } finally {
    loading.value = false
  }
}

const kpiCards = computed(() => {
  const s = stats.value?.stats
  if (!s) return []
  return [
    { label: t('mcp.statsTotal'), value: s.total_calls, precision: 0 },
    { label: t('mcp.statsSuccess'), value: s.success_count, precision: 0 },
    { label: t('mcp.statsError'), value: s.error_count, precision: 0 },
    { label: t('mcp.statsBlocked'), value: s.blocked_count, precision: 0 },
    { label: t('mcp.statsAvgDuration'), value: s.avg_duration_ms, precision: 0, suffix: 'ms' },
    { label: t('mcp.statsP95'), value: s.p95_duration_ms, precision: 0, suffix: 'ms' },
    { label: t('mcp.statsInputBytes'), value: s.total_input_bytes, precision: 0, suffix: 'B' },
    { label: t('mcp.statsOutputBytes'), value: s.total_output_bytes, precision: 0, suffix: 'B' },
  ]
})

const trendLabels = computed(() => stats.value?.calls_by_day.map((d) => d.date) || [])
const trendCounts = computed(() => stats.value?.calls_by_day.map((d) => d.count) || [])

const trendOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', className: 'echarts-tooltip-diy' },
  grid: { top: 16, right: 24, bottom: 24, left: 40 },
  xAxis: {
    type: 'category',
    data: trendLabels.value,
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#e5e6eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#86909c', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#86909c', fontSize: 11 },
    splitLine: { lineStyle: { color: '#f2f3f5' } },
  },
  series: [
    {
      name: t('mcp.statsTotal'),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: 'rgb(var(--arcoblue-6))' },
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(var(--arcoblue-6), 0.25)' },
            { offset: 1, color: 'rgba(var(--arcoblue-6), 0.02)' },
          ],
        },
      },
      data: trendCounts.value,
    },
  ],
}))

watch(() => props.serverId, fetchStats)
onMounted(fetchStats)
</script>

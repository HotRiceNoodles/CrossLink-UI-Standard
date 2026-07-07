<template>
  <a-card class="general-card">
    <template #title>
      <div class="chart-head">
        <span>{{ t('usageStat.metric') }}</span>
        <a-radio-group v-model="metric" type="button" size="small" @change="emitChange">
          <a-radio value="requests">{{ t('usageStat.metricRequests') }}</a-radio>
          <a-radio value="tokens">{{ t('usageStat.metricTokens') }}</a-radio>
          <a-radio value="cost">{{ t('usageStat.metricCost') }}</a-radio>
        </a-radio-group>
      </div>
    </template>
    <Chart :option="chartOption" height="320px" width="100%" />
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from '@/components/chart/index.vue'
import { getCurrencySymbol } from '@/utils/currency'
import type { EChartsOption } from 'echarts'
import type { DailyTrend } from '@/types'

const props = defineProps<{ data: DailyTrend[]; currency?: string }>()
const { t } = useI18n()

type Metric = 'requests' | 'tokens' | 'cost'
const metric = ref<Metric>('requests')
const emit = defineEmits<{ (e: 'change', metric: Metric): void }>()
function emitChange() {
  emit('change', metric.value)
}

const PRIMARY = '#165DFF'
const SECONDARY = '#00B42A'

const chartOption = computed<EChartsOption>(() => {
  const rows = props.data || []
  const labels = rows.map((r) => {
    const d = new Date(r.date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  let primarySeries: number[]
  let secondarySeries: number[]
  let primaryName: string
  let secondaryName: string | null = null

  if (metric.value === 'requests') {
    primaryName = t('usageStat.metricRequests')
    primarySeries = rows.map((r) => r.count)
    secondaryName = t('usageStat.fallbackDaily')
    secondarySeries = rows.map((r) => r.fallback_count_daily ?? 0)
  } else if (metric.value === 'tokens') {
    primaryName = t('usageStat.metricOutputTokens')
    secondaryName = t('usageStat.metricInputTokens')
    primarySeries = rows.map((r) => r.output_tokens ?? 0)
    secondarySeries = rows.map((r) => r.input_tokens ?? 0)
  } else {
    primaryName = t('usageStat.metricCost')
    primarySeries = rows.map((r) => Number(r.cost.toFixed(4)))
    secondarySeries = []
  }

  const series: EChartsOption['series'] = [
    {
      name: primaryName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: PRIMARY },
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(22,93,255,0.25)' },
            { offset: 1, color: 'rgba(22,93,255,0.02)' },
          ],
        },
      },
      data: primarySeries,
    },
  ]
  if (secondaryName) {
    series.push({
      name: secondaryName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      itemStyle: { color: SECONDARY },
      lineStyle: { width: 2 },
      data: secondarySeries,
    })
  }

  const legendData = secondaryName ? [primaryName, secondaryName] : [primaryName]

  return {
    tooltip: {
      trigger: 'axis',
      className: 'echarts-tooltip-diy',
      axisPointer: { type: 'cross' },
      valueFormatter: (v) => {
        if (metric.value === 'cost')
          return `${getCurrencySymbol(props.currency)}${Number(v).toFixed(4)}`
        return String(v)
      },
    },
    legend: {
      data: legendData,
      bottom: 0,
      itemWidth: 16,
      itemHeight: 8,
      textStyle: { color: '#86909c', fontSize: 12 },
    },
    grid: { top: 16, right: 24, bottom: 36, left: 56 },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#86909c', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f2f3f5' } },
      axisLabel: { color: '#86909c', fontSize: 11 },
    },
    series,
  }
})
</script>

<style scoped lang="less">
.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>

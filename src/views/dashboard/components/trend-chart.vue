<template>
  <a-card class="general-card" :title="t('dashboard.requestTrend')">
    <Chart :option="chartOption" height="320px" width="100%" />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EChartsOption } from 'echarts'
import type { DailyTrend } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  data: DailyTrend[]
}>()

const chartOption = computed<EChartsOption>(() => {
  const dates = (props.data || []).map((item) => {
    const d = new Date(item.date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${month}/${day}`
  })
  const counts = (props.data || []).map((item) => item.count)
  const tokens = (props.data || []).map((item) => item.tokens)

  return {
    tooltip: {
      trigger: 'axis',
      className: 'echarts-tooltip-diy',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: [t('dashboard.requestCount'), t('dashboard.tokenCount')],
      bottom: 0,
      itemWidth: 16,
      itemHeight: 8,
      textStyle: { color: 'var(--color-text-3)', fontSize: 12 },
    },
    grid: {
      top: 16,
      right: 60,
      bottom: 36,
      left: 60,
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'var(--color-border)' } },
      axisTick: { show: false },
      axisLabel: { color: 'var(--color-text-3)', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: t('dashboard.requestCount'),
        nameTextStyle: { color: 'var(--color-text-3)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'var(--color-fill-3)' } },
        axisLabel: { color: 'var(--color-text-3)', fontSize: 11 },
      },
      {
        type: 'value',
        name: t('dashboard.tokenCount'),
        nameTextStyle: { color: 'var(--color-text-3)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: 'var(--color-text-3)', fontSize: 11 },
      },
    ],
    series: [
      {
        name: t('dashboard.requestCount'),
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#165DFF' },
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
        data: counts,
      },
      {
        name: t('dashboard.tokenCount'),
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#00B42A' },
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,180,42,0.25)' },
              { offset: 1, color: 'rgba(0,180,42,0.02)' },
            ],
          },
        },
        data: tokens,
      },
    ],
  }
})
</script>

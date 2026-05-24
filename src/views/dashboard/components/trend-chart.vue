<template>
  <a-card class="general-card" title="请求趋势（近7天）">
    <Chart :option="chartOption" height="320px" width="100%" />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import type { DailyTrend } from '@/types'

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
      data: ['请求数', 'Token 数'],
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
      axisLine: { lineStyle: { color: '#e5e6eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#86909c', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: '请求数',
        nameTextStyle: { color: '#86909c', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f2f3f5' } },
        axisLabel: { color: '#86909c', fontSize: 11 },
      },
      {
        type: 'value',
        name: 'Token 数',
        nameTextStyle: { color: '#86909c', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#86909c', fontSize: 11 },
      },
    ],
    series: [
      {
        name: '请求数',
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
        name: 'Token 数',
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

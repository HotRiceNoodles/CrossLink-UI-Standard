<template>
  <a-card class="general-card">
    <template #title>{{ t('dashboard.errorRateTrend') }}</template>
    <a-empty v-if="!labels.length" :description="t('dashboard.noData')" />
    <Chart v-else :option="chartOption" height="280px" width="100%" />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from '@/components/chart/index.vue'
import type { EChartsOption } from 'echarts'

const { t } = useI18n()

const props = defineProps<{
  labels: string[]
  /** error rate values already converted to percent (0–100) */
  data: number[]
}>()

const chartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    className: 'echarts-tooltip-diy',
    axisPointer: { type: 'cross' },
    valueFormatter: (v: number) => `${v.toFixed(2)}%`,
  },
  grid: { top: 16, right: 24, bottom: 24, left: 48 },
  xAxis: {
    type: 'category',
    data: props.labels,
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#e5e6eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#86909c', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#86909c', fontSize: 11, formatter: '{value}%' },
    splitLine: { lineStyle: { color: '#f2f3f5' } },
  },
  series: [
    {
      name: t('dashboard.errorRate'),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: '#F53F3F' },
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245,63,63,0.25)' },
            { offset: 1, color: 'rgba(245,63,63,0.02)' },
          ],
        },
      },
      data: props.data,
    },
  ],
}))
</script>

<template>
  <a-card class="general-card">
    <template #title>{{ t('dashboard.performanceTrend') }}</template>
    <a-empty v-if="!labels.length" :description="t('dashboard.noData')" />
    <Chart v-else :option="chartOption" height="280px" width="100%" />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from '@/components/chart/index.vue'
import { formatLatency } from '@/utils/format'
import type { EChartsOption } from 'echarts'

const { t } = useI18n()

const props = defineProps<{
  labels: string[]
  latency: number[]
  ttft: number[]
}>()

const chartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    className: 'echarts-tooltip-diy',
    axisPointer: { type: 'cross' },
    valueFormatter: (v: number) => formatLatency(v),
  },
  legend: {
    data: [t('dashboard.avgLatency'), t('dashboard.firstTokenLatency')],
    bottom: 0,
    itemWidth: 16,
    itemHeight: 8,
    textStyle: { color: '#86909c', fontSize: 12 },
  },
  grid: { top: 16, right: 24, bottom: 36, left: 48 },
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
    axisLabel: { color: '#86909c', fontSize: 11, formatter: (v: number) => formatLatency(v) },
    splitLine: { lineStyle: { color: '#f2f3f5' } },
  },
  series: [
    buildLine(t('dashboard.avgLatency'), props.latency, '#00B42A', 'rgba(0,180,42,0.25)'),
    buildLine(t('dashboard.firstTokenLatency'), props.ttft, '#165DFF', 'rgba(22,93,255,0.25)'),
  ],
}))

function buildLine(name: string, data: number[], color: string, areaColor: string) {
  return {
    name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    itemStyle: { color },
    lineStyle: { width: 2 },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: areaColor },
          { offset: 1, color: 'rgba(0,0,0,0)' },
        ],
      },
    },
    data,
  }
}
</script>

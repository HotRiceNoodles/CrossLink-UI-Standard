<template>
  <div ref="chartRef" :style="{ width, height }" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'

echarts.use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

const props = defineProps<{
  option: EChartsOption
  width?: string
  height?: string
}>()

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null
const debouncedResize = useDebounceFn(() => chartInstance?.resize(), 200)

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(props.option)
  }
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(
  () => props.option,
  (newOption) => {
    if (chartInstance) {
      chartInstance.setOption(newOption, true)
    }
  },
  { deep: true },
)

onMounted(() => {
  nextTick(() => {
    initChart()
  })
  window.addEventListener('resize', debouncedResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
  chartInstance?.dispose()
})
</script>

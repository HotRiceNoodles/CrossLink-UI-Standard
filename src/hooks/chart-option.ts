import { computed, type Ref } from 'vue'
import type { EChartsOption } from 'echarts'

export function useChartOption(chartOption: Ref<EChartsOption>) {
  return computed(() => chartOption.value)
}

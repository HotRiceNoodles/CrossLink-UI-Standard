<template>
  <a-card class="general-card" :title="cardTitle">
    <Chart :option="chartOption" height="320px" width="100%" />
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from '@/components/chart/index.vue'
import type { EChartsOption } from 'echarts'
import type { ModelDistribution } from '@/types'
import { modelColor } from '../composables/model-color'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    data: ModelDistribution[]
    title?: string
  }>(),
  { title: '' },
)

const cardTitle = computed(() => props.title || t('dashboard.modelDistribution'))

const chartOption = computed<EChartsOption>(() => {
  const seriesData = (props.data || []).map((item) => ({
    name: item.model,
    value: item.count,
  }))

  return {
    tooltip: {
      trigger: 'item',
      className: 'echarts-tooltip-diy',
      formatter(params: any) {
        const { name, value, percent } = params
        return `<strong>${name}</strong><br/>${t('dashboard.requestCount')}: ${value}<br/>${t('dashboard.proportion')}: ${percent}%`
      },
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 0,
      top: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#4e5969', fontSize: 12 },
      formatter(name: string) {
        return name.length > 16 ? `${name.slice(0, 16)}...` : name
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        padAngle: 2,
        itemStyle: {
          borderRadius: 4,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: seriesData.map((item) => ({
          ...item,
          itemStyle: { color: modelColor(item.name) },
        })),
      },
    ],
  }
})
</script>

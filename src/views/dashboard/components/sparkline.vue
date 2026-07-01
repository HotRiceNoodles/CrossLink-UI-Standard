<template>
  <svg
    v-if="points.length"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    class="sparkline"
  >
    <polyline
      :points="points"
      fill="none"
      :stroke="color"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    data: number[]
    color?: string
    width?: number
    height?: number
  }>(),
  {
    color: 'rgb(var(--arcoblue-6))',
    width: 80,
    height: 28,
  },
)

// Map values into the SVG box, flattening single-point / constant series into a
// horizontal line so the card never looks broken.
const points = computed(() => {
  const d = props.data
  if (!d.length) return ''
  const min = Math.min(...d)
  const max = Math.max(...d)
  const span = max - min || 1
  const n = d.length
  const padY = 3
  const usableH = props.height - padY * 2
  return d
    .map((v, i) => {
      const x = n === 1 ? props.width / 2 : (i / (n - 1)) * props.width
      const y = padY + usableH - ((v - min) / span) * usableH
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})
</script>

<style scoped lang="less">
.sparkline {
  display: block;
}
</style>

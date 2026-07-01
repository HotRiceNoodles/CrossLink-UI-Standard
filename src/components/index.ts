import type { App } from 'vue'

/**
 * Global component plugin.
 *
 * Note: <Chart> used to be registered globally, which dragged the entire
 * echarts dependency into the initial bundle. It is now imported locally by
 * the dashboard sub-components that need it (model-pie.vue, trend-chart.vue),
 * so echarts lands in the lazy dashboard chunk instead. Register components
 * here only if they are used app-wide and lightweight.
 */
export default {
  install(_app: App) {
    // intentionally empty — see note above
  },
}

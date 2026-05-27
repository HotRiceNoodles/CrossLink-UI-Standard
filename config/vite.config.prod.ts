import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('echarts')) return 'echarts'
              if (id.includes('@arco-design')) return 'arco'
              if (id.includes('vue') || id.includes('pinia') || id.includes('@vueuse')) return 'vue'
              if (id.includes('dayjs') || id.includes('nprogress') || id.includes('axios'))
                return 'vendor-libs'
            }
          },
        },
      },
    },
  }),
)

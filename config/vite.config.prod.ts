import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            arco: ['@arco-design/web-vue'],
            echarts: ['echarts', 'vue-echarts'],
          },
        },
      },
    },
  })
)

import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    server: {
      port: 5180,
      open: true,
      proxy: {
        '/admin/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/v1': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }),
)

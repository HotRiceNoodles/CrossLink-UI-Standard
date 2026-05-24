import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), svgLoader()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          hack: `true; @import (reference) "${resolve(__dirname, '../src/assets/style/breakpoint.less').replace(/\\/g, '/')}";`,
        },
        javascriptEnabled: true,
      },
    },
  },
})

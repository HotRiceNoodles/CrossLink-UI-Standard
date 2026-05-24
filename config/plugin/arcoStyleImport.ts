import { vitePluginForArco } from '@arco-design/web-vue/es/vite'
import type { Plugin } from 'vite'

export default function arcoStyleImportPlugin(): Plugin {
  return vitePluginForArco({
    style: 'css',
  }) as Plugin
}

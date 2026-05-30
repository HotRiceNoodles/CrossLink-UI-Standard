import type { App } from 'vue'
import { logger } from '../core'

export function installVueErrorPlugin(app: App): void {
  app.config.errorHandler = (err, instance, info) => {
    const componentName = instance?.$options?.name || instance?.$options?.__name || 'Anonymous'
    logger.error(`Vue 组件错误 <${componentName}>: ${info}`, { error: err }, 'vue')
  }

  window.addEventListener('error', (event) => {
    const msg = event.message ?? ''
    if (msg.includes('ResizeObserver')) return

    logger.error(
      '全局 JS 错误',
      {
        error: event.error || new Error(event.message),
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      'vue',
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    logger.error(
      '未捕获的 Promise 异常',
      {
        error: reason instanceof Error ? reason : new Error(String(reason)),
      },
      'vue',
    )
  })
}

import type { Router } from 'vue-router'
import { logger } from '../core'

export function installRouterPlugin(router: Router): void {
  router.afterEach((to, from) => {
    logger.info(`路由跳转: ${from.fullPath} → ${to.fullPath}`, {
      to: to.name,
      from: from.name,
    }, 'router')
  })
}

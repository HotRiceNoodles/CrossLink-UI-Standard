import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import '@arco-design/web-vue/dist/arco.css'
import router from './router'
import store from './store'
import i18n from './locale'
import globalComponents from './components'
import './api/interceptor'
import '@/assets/style/global.less'
import App from './App.vue'
import { logger } from '@/logger'
import { installVueErrorPlugin } from '@/logger/plugins/vue-error'
import { installRouterPlugin } from '@/logger/plugins/router'
import type { LogEntry } from '@/logger/types'

logger.setLevel(import.meta.env.DEV ? 'debug' : 'warn')

const app = createApp(App)

installVueErrorPlugin(app)

app.use(ArcoVue)
app.use(ArcoVueIcon)
app.use(i18n)
app.use(router)
app.use(store)
app.use(globalComponents)

installRouterPlugin(router)

app.mount('#app')

if (typeof window !== 'undefined') {
  window.__logs__ = {
    list: () => logger.getBuffer(),
    errors: () => logger.getBuffer().filter((e: LogEntry) => e.level === 'error'),
    clear: () => { logger.clear() },
    export: () => { logger.export() },
  }
}

/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface Window {
  __logs__?: {
    list: () => unknown[]
    errors: () => unknown[]
    clear: () => void
    export: () => void
  }
}

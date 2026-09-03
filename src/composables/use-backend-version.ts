import { ref } from 'vue'
import { systemApi } from '@/api/system'

// 模块级缓存：整个应用只请求一次 /version
const backendVersion = ref<string | null>(null)
let pending: Promise<void> | null = null

async function fetchOnce() {
  try {
    backendVersion.value = await systemApi.getBackendVersion()
  } catch {
    // 失败静默（后端不可达或旧版本无此端点），tooltip/设置页自行降级展示
    backendVersion.value = null
  }
}

export function useBackendVersion() {
  if (!pending) pending = fetchOnce()
  return { backendVersion }
}

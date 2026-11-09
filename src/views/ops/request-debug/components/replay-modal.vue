<template>
  <a-modal
    :visible="visible"
    :title="t('requestDebug.replay.title')"
    :width="720"
    :mask-closable="false"
    :footer="false"
    unmount-on-close
    @cancel="$emit('update:visible', false)"
  >
    <a-space direction="vertical" fill style="width: 100%" :size="12">
      <a-alert type="warning">{{ t('requestDebug.replay.quotaTip') }}</a-alert>

      <a-form layout="vertical">
        <a-form-item :label="t('requestDebug.replay.key')" required>
          <a-select
            v-model="keyId"
            :placeholder="t('requestDebug.replay.keyPlaceholder')"
            :loading="keysLoading"
            allow-search
          >
            <a-option
              v-for="k in keys"
              :key="k.id"
              :value="k.id"
              :label="`${k.name} (${k.key_prefix}…)`"
            />
          </a-select>
        </a-form-item>

        <a-form-item :label="t('requestDebug.replay.overrides')">
          <a-textarea
            v-model="overridesText"
            :auto-size="{ minRows: 3, maxRows: 8 }"
            :placeholder="t('requestDebug.replay.overridesPlaceholder')"
            class="mono"
          />
          <span v-if="overridesError" class="overrides-error">{{ overridesError }}</span>
        </a-form-item>
      </a-form>

      <a-space>
        <a-button type="primary" :loading="replaying" :disabled="!keyId" @click="execute">
          {{ t('requestDebug.replay.execute') }}
        </a-button>
      </a-space>

      <!-- Passthrough result: the gateway's own status + body (prettified when JSON) -->
      <div v-if="result" class="replay-result">
        <div class="result-header">
          <a-tag :color="statusColor(result.status)">{{ result.status }}</a-tag>
          <span class="result-title">{{ t('requestDebug.replay.result') }}</span>
        </div>
        <pre class="result-body">{{ resultBody }}</pre>
      </div>
    </a-space>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { debugApi } from '@/api/debug'
import { keyApi } from '@/api/key'
import type { APIKey } from '@/types'

const props = defineProps<{ visible: boolean; seq: number }>()
defineEmits<{ 'update:visible': [value: boolean] }>()

const { t } = useI18n()

const keys = ref<APIKey[]>([])
const keysLoading = ref(false)
const keyId = ref<number>()
const overridesText = ref('')
const overridesError = ref('')
const replaying = ref(false)
const result = ref<{ status: number; body: unknown } | null>(null)

const resultBody = computed(() => {
  if (!result.value) return ''
  const body = result.value.body
  if (typeof body === 'string') return body
  try {
    return JSON.stringify(body, null, 2)
  } catch {
    return String(body)
  }
})

async function loadKeys() {
  keysLoading.value = true
  try {
    const res = await keyApi.list()
    // 只列出启用中的 key;重放会照常扣减其配额
    keys.value = res.data.filter((k) => k.status === 1)
  } catch {
    keys.value = []
  } finally {
    keysLoading.value = false
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      keyId.value = undefined
      overridesText.value = ''
      overridesError.value = ''
      result.value = null
      if (!keys.value.length) loadKeys()
    }
  },
)

function parseOverrides(): Record<string, unknown> | null {
  const text = overridesText.value.trim()
  if (!text) return {}
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      overridesError.value = t('requestDebug.replay.overridesObject')
      return null
    }
    overridesError.value = ''
    return parsed as Record<string, unknown>
  } catch {
    overridesError.value = t('requestDebug.replay.overridesInvalid')
    return null
  }
}

async function execute() {
  const overrides = parseOverrides()
  if (!overrides || !keyId.value) return
  replaying.value = true
  result.value = null
  try {
    // 后端原样透传网关响应（含 4xx/5xx），validateStatus 已放行所有状态码
    result.value = await debugApi.replay(props.seq, keyId.value, overrides)
  } catch {
    // 网络层失败（拦截器已记录日志）;透传路径上的错误都走 result 展示
    result.value = null
  } finally {
    replaying.value = false
  }
}

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return 'green'
  if (code >= 400 && code < 500) return 'orange'
  if (code >= 500) return 'red'
  return 'gray'
}
</script>

<style scoped lang="less">
.mono {
  font-family: var(--cl-font-mono);
}

.overrides-error {
  color: rgb(var(--red-6));
  font-size: 12px;
}

.replay-result {
  .result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .result-title {
      font-weight: 600;
    }
  }

  .result-body {
    max-height: 360px;
    overflow: auto;
    padding: 12px;
    margin: 0;
    font-family: var(--cl-font-mono);
    font-size: 12px;
    background: var(--color-fill-2);
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>

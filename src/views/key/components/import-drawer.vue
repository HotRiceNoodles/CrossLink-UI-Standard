<template>
  <a-drawer
    :visible="visible"
    :width="640"
    :title="step === 'input' ? t('key.import.title') : t('key.import.resultTitle')"
    :mask-closable="false"
    unmount-on-close
    :ok-loading="submitLoading"
    :ok-text="step === 'input' ? t('key.import.submit') : t('key.import.done')"
    :hide-cancel="step === 'result'"
    @cancel="handleClose"
    @ok="step === 'input' ? handleSubmit() : handleClose()"
  >
    <!-- Input step -->
    <template v-if="step === 'input'">
      <a-form layout="vertical">
        <a-form-item>
          <a-alert type="info" :closable="false">{{ t('key.import.help') }}</a-alert>
        </a-form-item>

        <a-form-item>
          <a-alert type="warning" :closable="false">{{ t('key.import.riskNotice') }}</a-alert>
        </a-form-item>

        <a-form-item :label="t('key.import.keysLabel')">
          <a-textarea
            v-model="rawText"
            :auto-size="{ minRows: 8, maxRows: 16 }"
            :placeholder="t('key.import.keysPlaceholder')"
          />
        </a-form-item>

        <a-form-item v-if="parseSummary">
          <span style="color: var(--color-text-3); font-size: 13px">
            {{ parseSummary }}
          </span>
          <template v-if="skippedLines.length">
            <div
              v-for="line in skippedLines.slice(0, 5)"
              :key="line.lineNo"
              style="margin-top: 4px; font-size: 12px"
            >
              <a-tag color="gray" size="small">{{ line.lineNo }}</a-tag>
              <code style="margin: 0 4px">{{ maskKey(line.key) }}</code>
              <a-tag :color="line.warning === 'duplicateLine' ? 'orange' : 'red'" size="small">
                {{ t(`key.import.${line.warning}`) }}
              </a-tag>
            </div>
            <div v-if="skippedLines.length > 5" style="font-size: 12px; color: var(--color-text-4)">
              …
            </div>
          </template>
        </a-form-item>

        <a-form-item v-if="tooMany" :validate-status="'error'">
          <a-alert type="error" :closable="false">{{ tooMany }}</a-alert>
        </a-form-item>

        <a-form-item :label="t('key.import.vendorLabel')">
          <a-select v-model="vendor" :placeholder="t('key.import.vendorPlaceholder')" allow-clear>
            <a-option value="openai" label="OpenAI" />
            <a-option value="anthropic" label="Anthropic" />
            <a-option value="gemini" label="Gemini" />
            <a-option value="azure" label="Azure" />
            <a-option value="other" :label="t('key.import.vendor.other')" />
          </a-select>
          <template v-if="detectedVendor">
            <span style="font-size: 12px; color: var(--color-text-3)">
              {{ t('key.import.vendorDetected', { vendor: detectedVendor }) }}
            </span>
          </template>
        </a-form-item>

        <a-form-item :label="t('key.import.protocolLabel')">
          <a-select v-model="protocol" allow-clear>
            <a-option value="" :label="t('key.import.protocol.any')" />
            <a-option value="openai" label="OpenAI (/v1/chat/completions)" />
            <a-option value="anthropic" label="Anthropic (/v1/messages)" />
          </a-select>
        </a-form-item>

        <a-form-item :label="t('key.import.allowedModelsLabel')">
          <a-select
            v-model="allowedModels"
            :placeholder="t('key.import.allowedModelsPlaceholder')"
            multiple
            allow-create
            allow-clear
            filterable
          >
            <a-option v-for="name in modelOptions" :key="name" :value="name" :label="name" />
          </a-select>
        </a-form-item>
      </a-form>
    </template>

    <!-- Result step -->
    <template v-else>
      <a-alert
        :type="importResult && importResult.created > 0 ? 'success' : 'warning'"
        :closable="false"
        style="margin-bottom: 16px"
      >
        {{ resultSummary }}
      </a-alert>

      <a-alert
        v-if="importResult && importResult.created > 0"
        type="warning"
        :closable="false"
        style="margin-bottom: 16px"
      >
        {{ t('key.import.rotateHint') }}
      </a-alert>

      <a-table
        :data="importResult?.results ?? []"
        row-key="index"
        size="small"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
      >
        <template #columns>
          <a-table-column :title="t('key.import.colLine')" :width="60" align="center">
            <template #cell="{ record }">
              {{ lineNoOf(record) }}
            </template>
          </a-table-column>
          <a-table-column :title="t('key.import.colName')" data-index="name" :width="140">
            <template #cell="{ record }">
              <span v-if="record.name">{{ record.name }}</span>
              <span v-else style="color: var(--color-text-4)">-</span>
            </template>
          </a-table-column>
          <a-table-column :title="t('key.import.colPrefix')" :width="110" align="center">
            <template #cell="{ record }">
              <a-tag
                v-if="record.key_prefix"
                color="arcoblue"
                style="font-family: var(--cl-font-mono)"
              >
                {{ record.key_prefix }}...
              </a-tag>
              <span v-else style="color: var(--color-text-4)">-</span>
            </template>
          </a-table-column>
          <a-table-column :title="t('key.import.colStatus')" :width="110" align="center">
            <template #cell="{ record }">
              <a-tag :color="statusColor(record.status)">
                {{ t(`key.import.status.${record.status}`) }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column :title="t('key.import.colDetail')">
            <template #cell="{ record }">
              <span v-if="record.status === 'duplicate'">
                {{ t('key.import.existingKeyId', { id: record.existing_key_id }) }}
              </span>
              <template v-else-if="record.status === 'model_not_found'">
                <a-tag v-for="m in record.missing_models ?? []" :key="m" color="red" size="small">
                  {{ m }}
                </a-tag>
              </template>
              <span v-else-if="record.reason" style="color: var(--color-text-3)">
                {{ record.reason }}
              </span>
              <span v-else style="color: var(--color-text-4)">-</span>
            </template>
          </a-table-column>
        </template>
      </a-table>

      <div style="margin-top: 16px">
        <a-button @click="backToInput">{{ t('key.import.importAgain') }}</a-button>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { keyApi } from '@/api/key'
import { useLoading } from '@/hooks/loading'
import type { KeyImportResponse, KeyVendor } from '@/types'

interface Props {
  visible: boolean
  modelOptions: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const { t } = useI18n()
const { loading: submitLoading, setLoading: setSubmitLoading } = useLoading()

const step = ref<'input' | 'result'>('input')
const rawText = ref('')
const vendor = ref<KeyVendor | ''>('')
const protocol = ref<'' | 'openai' | 'anthropic'>('')
const allowedModels = ref<string[]>([])
const importResult = ref<KeyImportResponse | null>(null)
const detectedVendor = ref('')
/** 提交数组下标 → 原始行号（无效行已在客户端剔除，后端 index 指提交数组）。 */
const submitLineMap = ref<number[]>([])

// 与后端 ValidateImportedKey 对齐：16–200 个可打印 ASCII 字符（0x21–0x7E，天然不含空格）
const KEY_FORMAT = /^[\x21-\x7E]{16,200}$/

interface ParsedLine {
  lineNo: number
  key: string
  name?: string
  warning?: 'invalidKeyFormat' | 'duplicateLine'
}

const parsedLines = computed<ParsedLine[]>(() => {
  const seen = new Set<string>()
  const lines: ParsedLine[] = []
  rawText.value.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    const comma = line.indexOf(',')
    const key = (comma >= 0 ? line.slice(0, comma) : line).trim()
    const namePart = comma >= 0 ? line.slice(comma + 1).trim() : ''
    const parsed: ParsedLine = {
      lineNo: i + 1,
      key,
      ...(namePart ? { name: namePart } : {}),
    }
    if (!KEY_FORMAT.test(key)) parsed.warning = 'invalidKeyFormat'
    else if (seen.has(key)) parsed.warning = 'duplicateLine'
    else seen.add(key)
    lines.push(parsed)
  })
  return lines
})

const validItems = computed(() => parsedLines.value.filter((l) => !l.warning))
const skippedLines = computed(() => parsedLines.value.filter((l) => l.warning))

const parseSummary = computed(() => {
  if (!parsedLines.value.length) return ''
  return t('key.import.parseSummary', {
    total: parsedLines.value.length,
    valid: validItems.value.length,
    skipped: skippedLines.value.length,
  })
})

const tooMany = computed(() =>
  validItems.value.length > 100 ? t('key.import.tooMany', { n: validItems.value.length }) : '',
)

const resultSummary = computed(() => {
  if (!importResult.value) return ''
  return t('key.import.resultSummary', {
    created: importResult.value.created,
    total: importResult.value.results.length,
  })
})

// vendor 前缀启发式：仅在用户未手动选择时自动填，不覆盖用户选择
const VENDOR_PREFIXES: Array<[string, KeyVendor]> = [
  ['sk-ant-', 'anthropic'],
  ['sk-', 'openai'],
  ['AIza', 'gemini'],
]

watch(
  () => validItems.value[0]?.key,
  (firstKey) => {
    if (!firstKey || vendor.value) return
    for (const [prefix, v] of VENDOR_PREFIXES) {
      if (firstKey.startsWith(prefix)) {
        vendor.value = v
        detectedVendor.value = v
        return
      }
    }
  },
)

function maskKey(key: string): string {
  return `${key.slice(0, 8)}…`
}

function lineNoOf(record: { index: number }): number {
  return submitLineMap.value[record.index] ?? record.index + 1
}

function statusColor(status: string): string {
  if (status === 'created') return 'green'
  if (status === 'duplicate') return 'orange'
  return 'red'
}

function backToInput() {
  importResult.value = null
  step.value = 'input'
}

async function handleSubmit() {
  if (!validItems.value.length) {
    Message.error(t('key.import.noValidKeys'))
    return
  }
  if (tooMany.value) return

  const v = vendor.value
  const p = protocol.value
  const models = allowedModels.value
  setSubmitLoading(true)
  try {
    submitLineMap.value = validItems.value.map((l) => l.lineNo)
    const res = await keyApi.import({
      keys: validItems.value.map((l) => ({
        key: l.key,
        ...(l.name ? { name: l.name } : {}),
        ...(v ? { vendor: v } : {}),
        ...(p ? { protocol: p } : {}),
        ...(models.length ? { allowed_models: models } : {}),
      })),
    })
    importResult.value = res.data
    step.value = 'result'
    if (res.data.created > 0) {
      Message.success(t('key.import.importedCount', { n: res.data.created }))
      emit('success')
    }
  } catch (err) {
    const e = err as { response?: { data?: { error_code?: string; error?: string } } }
    if (e.response?.data?.error_code === 'insufficient_permissions') {
      Message.error(t('key.errorPermissions'))
    } else {
      Message.error(e.response?.data?.error || t('key.import.importFail'))
    }
  } finally {
    setSubmitLoading(false)
  }
}

function handleClose() {
  emit('update:visible', false)
}

// 关闭时全量重置（「再次导入」保留 rawText 的修正场景只在 drawer 内部发生）
watch(
  () => props.visible,
  (val) => {
    if (!val) {
      step.value = 'input'
      rawText.value = ''
      vendor.value = ''
      protocol.value = ''
      allowedModels.value = []
      importResult.value = null
      detectedVendor.value = ''
      submitLineMap.value = []
    }
  },
)
</script>

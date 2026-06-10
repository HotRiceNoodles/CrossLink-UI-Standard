<template>
  <div class="engine-config-editor">
    <!-- Mode toggle bar -->
    <div class="mode-bar">
      <a-radio-group v-model="mode" type="button" size="small">
        <a-radio value="form">{{ t('safety.config.modeForm') }}</a-radio>
        <a-radio value="json">{{ t('safety.config.modeJson') }}</a-radio>
      </a-radio-group>
      <a-tooltip
        v-if="currentSchema?.hasComplexFields && mode === 'form'"
        :content="t('safety.config.complexFieldHint', [complexFieldNames])"
      >
        <icon-exclamation-circle
          style="color: rgb(var(--warning-6)); margin-left: 8px; cursor: help"
        />
      </a-tooltip>
    </div>

    <!-- Form mode -->
    <engine-config-form
      v-if="mode === 'form'"
      :model-value="modelValue"
      :engine-type="engineType"
      :disabled="disabled"
      @update:model-value="(v: Record<string, any>) => emit('update:modelValue', v)"
    />

    <!-- JSON mode -->
    <div v-else class="json-mode">
      <a-textarea
        :model-value="jsonText"
        :auto-size="{ minRows: 6, maxRows: 16 }"
        :status="jsonError ? 'danger' : undefined"
        @input="handleJsonInput"
      />
      <div v-if="jsonError" class="json-error">
        <span style="color: rgb(var(--danger-6))">{{ t('safety.config.jsonInvalid') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { engineSchemaMap, getDefaultsForEngine } from '@/config/engine-schema'
import type { GuardrailEngineType, ConfigEditorMode, ConfigFieldSchema } from '@/types'
import EngineConfigForm from './engine-config-form.vue'

const props = defineProps<{
  modelValue: Record<string, any>
  engineType: GuardrailEngineType
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: Record<string, any>): void
}>()

const { t } = useI18n()

const mode = ref<ConfigEditorMode>('form')
const jsonText = ref('')
const jsonError = ref(false)

const currentSchema = computed(() => engineSchemaMap.get(props.engineType))

const complexFieldNames = computed(() => {
  if (!currentSchema.value) return ''
  return currentSchema.value.fields
    .filter((f: ConfigFieldSchema) => f.type === 'object_array' || f.type === 'key_value_map')
    .map((f: ConfigFieldSchema) => t(f.labelKey))
    .join('、')
})

/**
 * Handle JSON textarea input
 */
function handleJsonInput(val: string) {
  jsonText.value = val
  try {
    const parsed = JSON.parse(val)
    jsonError.value = false
    emit('update:modelValue', parsed)
  } catch {
    jsonError.value = true
  }
}

/**
 * When mode switches:
 * - form → json: serialize current config to JSON string
 * - json → form: parse JSON, emit parsed object; on failure, block the switch
 */
watch(mode, (newMode, oldMode) => {
  if (newMode === 'json' && oldMode === 'form') {
    // Serialize config to JSON
    jsonText.value = JSON.stringify(props.modelValue, null, 2)
    jsonError.value = false
  } else if (newMode === 'form' && oldMode === 'json') {
    // Try to parse JSON before switching
    try {
      const parsed = JSON.parse(jsonText.value)
      jsonError.value = false
      emit('update:modelValue', parsed)
    } catch {
      jsonError.value = true
      Message.warning(t('safety.config.jsonInvalid'))
      // Revert mode to json
      mode.value = 'json'
    }
  }
})

/**
 * When engine type changes, reset to form mode and emit defaults
 */
watch(
  () => props.engineType,
  (newType) => {
    // Check if this engine type has a schema
    const hasSchema = engineSchemaMap.has(newType)
    if (!hasSchema) {
      // Unknown engine type → force JSON mode
      mode.value = 'json'
      jsonText.value = JSON.stringify(props.modelValue, null, 2)
    } else {
      mode.value = 'form'
    }
  },
)

/**
 * When modelValue changes externally (e.g. parent loads edit data),
 * update jsonText if in JSON mode so it stays in sync.
 */
watch(
  () => props.modelValue,
  (val) => {
    if (mode.value === 'json') {
      // Only update if the text would be different (avoid overwriting user input)
      const serialized = JSON.stringify(val, null, 2)
      if (serialized !== jsonText.value && !jsonError.value) {
        jsonText.value = serialized
      }
    }
  },
  { deep: true },
)
</script>

<style scoped lang="less">
.engine-config-editor {
  .mode-bar {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  .json-mode {
    .json-error {
      margin-top: 4px;
      font-size: 12px;
    }
  }
}
</style>

<template>
  <div class="engine-config-form">
    <template v-if="schema">
      <!-- Simple fields -->
      <template v-for="field in simpleFields" :key="field.key">
        <!-- String (text input) -->
        <a-form-item
          v-if="field.type === 'string' && !field.sensitive"
          :label="t(field.labelKey)"
          :required="field.required"
        >
          <a-input
            :model-value="getFieldValue(field.key)"
            :placeholder="field.placeholderKey ? t(field.placeholderKey) : undefined"
            allow-clear
            @update:model-value="(v: string) => updateField(field.key, v)"
          />
        </a-form-item>

        <!-- String (password) -->
        <a-form-item
          v-else-if="field.type === 'string' && field.sensitive"
          :label="t(field.labelKey)"
          :required="field.required"
        >
          <a-input-password
            :model-value="getFieldValue(field.key)"
            :placeholder="field.placeholderKey ? t(field.placeholderKey) : undefined"
            @update:model-value="(v: string) => updateField(field.key, v)"
          />
        </a-form-item>

        <!-- Number -->
        <a-form-item v-else-if="field.type === 'number'" :label="t(field.labelKey)">
          <a-input-number
            :model-value="getFieldValue(field.key)"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :precision="field.precision"
            :placeholder="field.placeholderKey ? t(field.placeholderKey) : undefined"
            style="width: 100%"
            @update:model-value="(v: number) => updateField(field.key, v)"
          />
          <template v-if="field.tooltipKey" #extra>
            <span style="color: var(--color-text-3); font-size: 12px">
              {{ t(field.tooltipKey) }}
            </span>
          </template>
        </a-form-item>

        <!-- Boolean (switch) -->
        <a-form-item v-else-if="field.type === 'boolean'" :label="t(field.labelKey)">
          <a-switch
            :model-value="getFieldValue(field.key)"
            @change="(v: boolean) => updateField(field.key, v)"
          />
          <template v-if="field.tooltipKey" #extra>
            <span style="color: var(--color-text-3); font-size: 12px">
              {{ t(field.tooltipKey) }}
            </span>
          </template>
        </a-form-item>

        <!-- Select -->
        <a-form-item v-else-if="field.type === 'select'" :label="t(field.labelKey)">
          <a-select
            :model-value="getFieldValue(field.key)"
            :placeholder="field.placeholderKey ? t(field.placeholderKey) : undefined"
            style="width: 100%"
            @update:model-value="(v: string) => updateField(field.key, v)"
          >
            <a-option
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
              :label="t(opt.label)"
            />
          </a-select>
        </a-form-item>

        <!-- Multiselect -->
        <a-form-item v-else-if="field.type === 'multiselect'" :label="t(field.labelKey)">
          <a-select
            :model-value="getFieldValue(field.key)"
            :placeholder="field.placeholderKey ? t(field.placeholderKey) : undefined"
            multiple
            allow-clear
            style="width: 100%"
            @update:model-value="(v: string[]) => updateField(field.key, v)"
          >
            <a-option
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
              :label="t(opt.label)"
            />
          </a-select>
        </a-form-item>

        <!-- String array (tag input) -->
        <a-form-item v-else-if="field.type === 'string_array'" :label="t(field.labelKey)">
          <a-input-tag
            :model-value="getFieldValue(field.key)"
            :placeholder="field.placeholderKey ? t(field.placeholderKey) : undefined"
            allow-clear
            @update:model-value="(v: string[]) => updateField(field.key, v)"
          />
        </a-form-item>
      </template>

      <!-- Complex fields advisory -->
      <a-alert v-if="complexFields.length > 0" type="info" style="margin-top: 4px">
        {{ t('safety.config.complexFieldHint', [complexFieldNames]) }}
      </a-alert>
    </template>

    <!-- Unknown engine type fallback -->
    <a-alert v-else type="warning">
      {{ t('safety.config.unknownEngine') }}
    </a-alert>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { engineSchemaMap } from '../engine-schema'
import type { GuardrailEngineType, ConfigFieldSchema } from '@/types'

const props = defineProps<{
  modelValue: Record<string, any>
  engineType: GuardrailEngineType
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: Record<string, any>): void
}>()

const { t } = useI18n()

// Local copy of config to avoid mutating parent directly
const localConfig = ref<Record<string, any>>({ ...props.modelValue })

// Sync from parent (e.g. when editing loads new data)
watch(
  () => props.modelValue,
  (val) => {
    localConfig.value = { ...val }
  },
  { deep: true },
)

const schema = computed(() => engineSchemaMap.get(props.engineType))

const simpleFields = computed<ConfigFieldSchema[]>(() => {
  if (!schema.value) return []
  return schema.value.fields.filter((f) => !isComplexType(f.type))
})

const complexFields = computed<ConfigFieldSchema[]>(() => {
  if (!schema.value) return []
  return schema.value.fields.filter((f) => isComplexType(f.type))
})

const complexFieldNames = computed(() => {
  return complexFields.value.map((f) => t(f.labelKey)).join(', ')
})

function isComplexType(type: string): boolean {
  return type === 'object_array' || type === 'key_value_map'
}

/**
 * Get field value, falling back to the schema default if missing
 */
function getFieldValue(key: string): any {
  const val = localConfig.value[key]
  if (val !== undefined) return val
  // Fall back to schema default
  const field = schema.value?.fields.find((f) => f.key === key)
  return field?.defaultValue
}

/**
 * Update a single field and emit the new config object
 */
function updateField(key: string, value: any) {
  const newConfig = { ...localConfig.value, [key]: value }
  localConfig.value = newConfig
  emit('update:modelValue', newConfig)
}
</script>

<style scoped lang="less">
.engine-config-form {
  :deep(.arco-form-item) {
    margin-bottom: 16px;
  }
}
</style>

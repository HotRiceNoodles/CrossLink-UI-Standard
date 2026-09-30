<template>
  <a-form-item :label="t(def.labelKey)" class="config-field-row">
    <template #extra>
      <span v-if="def.descKey" class="field-desc">{{ t(def.descKey) }}</span>
    </template>

    <div class="field-controls">
      <!-- Source / state badges -->
      <div v-if="badges.length" class="field-badges">
        <a-tag v-for="b in badges" :key="b.label" :color="b.color" size="small">
          {{ b.label }}
        </a-tag>
      </div>

      <!-- String -->
      <a-input
        v-if="inputKind === 'input'"
        :model-value="String(modelValue ?? '')"
        :placeholder="placeholder"
        :disabled="disabled || deleting"
        allow-clear
        @update:model-value="(v: string) => emit('update:modelValue', v)"
      />

      <!-- Sensitive (write-only) -->
      <a-input-password
        v-else-if="inputKind === 'password'"
        :model-value="String(modelValue ?? '')"
        :placeholder="placeholder"
        :disabled="disabled || deleting"
        @update:model-value="(v: string) => emit('update:modelValue', v)"
      />

      <!-- Int / float -->
      <a-input-number
        v-else-if="inputKind === 'number'"
        :model-value="typeof modelValue === 'number' ? modelValue : undefined"
        :min="def.min"
        :max="def.max"
        :step="def.type === 'float' ? 0.1 : 1"
        :disabled="disabled || deleting"
        style="width: 100%"
        @update:model-value="(v: number | undefined) => emit('update:modelValue', v)"
      />

      <!-- Bool -->
      <a-switch
        v-else-if="inputKind === 'switch'"
        :model-value="!!modelValue"
        :disabled="disabled || deleting"
        @change="(v: boolean) => emit('update:modelValue', v)"
      />

      <!-- string[] -->
      <a-input-tag
        v-else-if="inputKind === 'tags'"
        :model-value="Array.isArray(modelValue) ? modelValue : []"
        :placeholder="placeholder"
        :disabled="disabled || deleting"
        allow-clear
        @update:model-value="(v: string[]) => emit('update:modelValue', v)"
      />
    </div>

    <!-- Row-level affordances -->
    <div class="field-actions">
      <a-tag v-if="clearing" color="orangered" size="small">
        {{ t('systemConfig.willClear') }}
      </a-tag>
      <a-tag v-if="deleting" color="orange" size="small">
        {{ t('systemConfig.willReset') }}
      </a-tag>
      <a-button
        v-if="def.sensitive && !deleting && !disabled"
        type="text"
        size="mini"
        @click="emit('toggle-clear')"
      >
        {{ clearing ? t('common.cancel') : t('systemConfig.clear') }}
      </a-button>
      <a-button
        v-if="canReset && !clearing"
        type="text"
        size="mini"
        :disabled="disabled"
        @click="emit('toggle-reset')"
      >
        {{ deleting ? t('common.cancel') : t('systemConfig.resetToDefault') }}
      </a-button>
    </div>
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConfigKeyDef, SystemConfigMeta } from '@/types'

const props = defineProps<{
  def: ConfigKeyDef
  meta?: SystemConfigMeta
  modelValue: unknown
  /** Sensitive clear pending (will send ""). */
  clearing?: boolean
  /** Reset-to-default pending (will send null). */
  deleting?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'toggle-clear'): void
  (e: 'toggle-reset'): void
}>()

const { t } = useI18n()

const inputKind = computed(() => {
  if (props.def.sensitive) return 'password'
  switch (props.def.type) {
    case 'string':
      return 'input'
    case 'int':
    case 'float':
    case 'duration_seconds':
      return 'number'
    case 'bool':
      return 'switch'
    case 'string[]':
      return 'tags'
    default:
      return 'input'
  }
})

const placeholder = computed(() => {
  if (props.def.sensitive) return t('systemConfig.keepPlaceholder')
  if (props.def.key === 'captcha_provider') return 'slider'
  return undefined
})

// Reset is offered for keys currently overridden in the DB (source=db).
const canReset = computed(() => props.meta?.source === 'db')

interface Badge {
  label: string
  color: string
}

const badges = computed<Badge[]>(() => {
  const list: Badge[] = []
  const meta = props.meta
  if (meta) {
    if (meta.source === 'db') list.push({ label: t('systemConfig.source.db'), color: 'green' })
    else if (meta.source === 'default')
      list.push({ label: t('systemConfig.source.default'), color: 'gray' })
    else list.push({ label: t('systemConfig.source.dbError'), color: 'red' })
    if (meta.sensitive) {
      list.push(
        meta.set
          ? { label: t('systemConfig.configured'), color: 'blue' }
          : { label: t('systemConfig.notConfigured'), color: 'gray' },
      )
    }
    if (meta.restart_required) {
      list.push({ label: t('systemConfig.restartBadge'), color: 'orangered' })
    } else if (props.def.hot) {
      list.push({ label: t('systemConfig.hotBadge'), color: 'arcoblue' })
    }
  }
  return list
})
</script>

<style scoped lang="less">
.config-field-row {
  margin-bottom: 16px;
}

.field-desc {
  color: var(--color-text-3);
  font-size: 12px;
}

.field-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.field-controls {
  width: 100%;
}

.field-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  min-height: 24px;
}
</style>

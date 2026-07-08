<template>
  <div class="kv-editor">
    <div v-for="(row, idx) in rows" :key="idx" class="kv-row">
      <a-input
        v-model="row.key"
        :placeholder="keyPlaceholder"
        class="kv-input"
        @change="emitChange"
      />
      <span class="kv-sep">:</span>
      <a-input
        v-model="row.value"
        :placeholder="valuePlaceholder"
        class="kv-input"
        @change="emitChange"
      />
      <a-button type="text" status="danger" @click="removeRow(idx)">
        <template #icon><icon-delete /></template>
      </a-button>
    </div>
    <a-button type="dashed" long @click="addRow">
      <template #icon><icon-plus /></template>
      {{ addLabel }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  modelValue?: Record<string, string>
  keyPlaceholder?: string
  valuePlaceholder?: string
  addLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

interface Row {
  key: string
  value: string
}

const rows = ref<Row[]>([])

function syncFromModel(model?: Record<string, string>) {
  if (!model || !Object.keys(model).length) {
    rows.value = []
    return
  }
  rows.value = Object.entries(model).map(([key, value]) => ({ key, value: String(value) }))
}

// Initialize once on mount; subsequent model changes (e.g. drawer reopen with a
// different record) re-sync.
syncFromModel(props.modelValue)

watch(
  () => props.modelValue,
  (m) => syncFromModel(m),
)

function emitChange() {
  const obj: Record<string, string> = {}
  rows.value.forEach((r) => {
    if (r.key) obj[r.key] = r.value
  })
  emit('update:modelValue', obj)
}

function addRow() {
  rows.value.push({ key: '', value: '' })
}

function removeRow(idx: number) {
  rows.value.splice(idx, 1)
  emitChange()
}

const keyPlaceholder = props.keyPlaceholder || 'key'
const valuePlaceholder = props.valuePlaceholder || 'value'
const addLabel = props.addLabel || t('common.confirm')
</script>

<style scoped lang="less">
.kv-editor {
  width: 100%;
}

.kv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.kv-input {
  flex: 1 1 auto;
}

.kv-sep {
  color: var(--color-text-3);
}
</style>

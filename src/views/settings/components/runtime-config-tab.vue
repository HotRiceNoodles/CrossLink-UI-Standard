<template>
  <div class="runtime-config-tab">
    <a-spin :loading="loading" style="width: 100%">
      <div class="tab-body">
        <div class="tab-toolbar">
          <span v-if="config" class="loaded-at">
            {{ t('systemConfig.loadedAt') }}: {{ formatTime(config.loaded_at) }}
          </span>
          <a-button size="small" :loading="loading" @click="load">
            <template #icon><icon-refresh /></template>
            {{ t('systemConfig.refresh') }}
          </a-button>
        </div>

        <a-alert v-if="loadError" type="error">{{ t('systemConfig.loadFail') }}</a-alert>

        <!-- Restart-required warning: stays until reload after an apply that needs one -->
        <a-alert v-if="restartKeys.length" type="warning" closable @close="restartKeys = []">
          {{ t('systemConfig.restartWarning', { keys: restartKeys.join(', ') }) }}
        </a-alert>

        <a-collapse v-if="config" v-model:active-key="openSections" class="config-collapse">
          <a-collapse-item
            v-for="section in sections"
            :key="section.id"
            :header="sectionHeader(section.id)"
          >
            <a-form layout="vertical" class="section-form">
              <config-field-row
                v-for="def in fieldsBySection(section.id)"
                :key="def.key"
                :def="def"
                :meta="config.meta[def.key]"
                :model-value="draft[def.key]"
                :clearing="clears.has(def.key)"
                :deleting="deletes.has(def.key)"
                :disabled="!canEdit"
                @update:model-value="(v) => onFieldInput(def.key, v)"
                @toggle-clear="toggleClear(def.key)"
                @toggle-reset="toggleReset(def.key)"
              />
            </a-form>
          </a-collapse-item>
        </a-collapse>

        <!-- Sticky save bar -->
        <div v-if="canEdit && config" class="save-bar" :class="{ active: isDirty }">
          <span class="change-count">{{ t('systemConfig.changes', { count: changeCount }) }}</span>
          <a-space>
            <a-button :disabled="!isDirty || saving" @click="discard">
              {{ t('systemConfig.discard') }}
            </a-button>
            <a-button type="primary" :loading="saving" :disabled="!isDirty" @click="save">
              {{ t('systemConfig.save') }}
            </a-button>
          </a-space>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Modal } from '@arco-design/web-vue'
import { systemConfigApi } from '@/api/system-config'
import { useLoading } from '@/hooks/loading'
import { useUserStore } from '@/store/modules/user'
import { formatTime } from '@/utils/format'
import { CONFIG_KEYS_MAP, CONFIG_SECTIONS, fieldsBySection } from '../config-registry'
import type { SystemConfigResponse } from '@/types'
import ConfigFieldRow from './config-field-row.vue'

const { t } = useI18n()
const userStore = useUserStore()
const { loading, setLoading } = useLoading(true)

const config = ref<SystemConfigResponse | null>(null)
const loadError = ref(false)
// Sparse-change state: only these three ever go into the PUT payload.
const draft = ref<Record<string, unknown>>({})
const clears = ref(new Set<string>())
const deletes = ref(new Set<string>())
const restartKeys = ref<string[]>([])
const saving = ref(false)

const sections = CONFIG_SECTIONS
const openSections = ref<string[]>(['smtp'])

const canEdit = computed(() => userStore.hasPermission('system:update'))

function sectionHeader(id: string): string {
  return t(`systemConfig.sections.${id}`)
}

const changeCount = computed(
  () => changedKeys.value.length + clears.value.size + deletes.value.size,
)

// Keys whose draft value differs from the loaded value (joined-string compare
// covers arrays; sensitive keys count when non-empty text is typed).
const changedKeys = computed(() => {
  if (!config.value) return []
  const result: string[] = []
  for (const [key, value] of Object.entries(draft.value)) {
    if (deletes.value.has(key) || clears.value.has(key)) continue
    const original = config.value.settings[key]
    if (value === '' || value === undefined || value === null) continue
    if (Array.isArray(value) && Array.isArray(original)) {
      if (value.join('\n') !== original.join('\n')) result.push(key)
      continue
    }
    if (value !== original) result.push(key)
  }
  return result
})

const isDirty = computed(() => changeCount.value > 0)

function onFieldInput(key: string, value: unknown) {
  // Editing a field cancels any pending clear/reset intent for it.
  clears.value.delete(key)
  deletes.value.delete(key)
  draft.value[key] = value
}

function toggleClear(key: string) {
  const next = new Set(clears.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
    deletes.value.delete(key)
    draft.value[key] = ''
  }
  clears.value = next
}

function toggleReset(key: string) {
  const next = new Set(deletes.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
    clears.value.delete(key)
    draft.value[key] = ''
  }
  deletes.value = next
}

function rebuildDraft() {
  const next: Record<string, unknown> = {}
  if (config.value) {
    for (const [key, value] of Object.entries(config.value.settings)) {
      // Sensitive values are always "" from the API — keep them empty locally
      // so the write-only input starts blank ("leave empty to keep").
      next[key] = value
    }
  }
  draft.value = next
  clears.value = new Set()
  deletes.value = new Set()
}

function discard() {
  rebuildDraft()
}

async function load() {
  setLoading(true)
  loadError.value = false
  try {
    const res = await systemConfigApi.get()
    config.value = res.data
    rebuildDraft()
  } catch {
    loadError.value = true
  } finally {
    setLoading(false)
  }
}

/** Client-side pattern check (Go duration strings); the server re-validates. */
function validateChanges(): boolean {
  for (const key of changedKeys.value) {
    const def = CONFIG_KEYS_MAP.get(key)
    const value = draft.value[key]
    if (def?.pattern && typeof value === 'string' && value && !def.pattern.test(value)) {
      Message.error(`${t(def.labelKey)}: ${t('systemConfig.durationHint')}`)
      return false
    }
  }
  return true
}

function buildPayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const key of changedKeys.value) {
    payload[key] = draft.value[key]
  }
  clears.value.forEach((key) => {
    payload[key] = ''
  })
  deletes.value.forEach((key) => {
    payload[key] = null
  })
  return payload
}

function resolveError(err: unknown): string {
  const e = err as { response?: { data?: { error?: string; error_code?: string } } }
  const code = e.response?.data?.error_code
  if (code === 'invalid_request') return t('systemConfig.errors.invalid_request')
  if (code === 'base_url_invalid') return t('systemConfig.errors.base_url_invalid')
  return e.response?.data?.error || t('systemConfig.saveFail')
}

function save() {
  if (!validateChanges()) return
  const payload = buildPayload()
  const restartPending = Object.keys(payload).filter((key) => {
    const meta = config.value?.meta[key]
    return meta?.restart_required
  })
  const doSave = async () => {
    saving.value = true
    try {
      const res = await systemConfigApi.update(payload)
      Message.success(t('systemConfig.saveSuccess'))
      if (res.restart_required_applied.length) {
        restartKeys.value = res.restart_required_applied
      }
    } catch (err) {
      Message.error(resolveError(err))
    } finally {
      saving.value = false
    }
    // 刷新放在 try 外：保存已成功，刷新失败不应再弹「更新失败」（load 内部有 loadError 兜底）
    await load()
  }
  if (restartPending.length) {
    Modal.warning({
      title: t('systemConfig.restartBadge'),
      content: t('systemConfig.restartWarning', { keys: restartPending.join(', ') }),
      okText: t('common.confirm'),
      hideCancel: false,
      onOk: doSave,
    })
    return
  }
  doSave()
}

onMounted(load)
</script>

<style scoped lang="less">
.runtime-config-tab {
  .tab-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.loaded-at {
  font-size: 12px;
  color: var(--color-text-3);
}

.config-collapse {
  background-color: var(--color-bg-2);
}

.section-form {
  max-width: 560px;
}

.save-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background-color: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  opacity: 0.65;

  &.active {
    opacity: 1;
    border-color: rgb(var(--arcoblue-3));
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  }
}

.change-count {
  font-size: 13px;
  color: var(--color-text-2);
}
</style>

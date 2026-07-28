<template>
  <div class="template-page">
    <a-card class="general-card">
      <template #title>{{ t('promptTemplate.title') }}</template>

      <!-- Search / Filter -->
      <a-row :gutter="16" align="center">
        <a-col :span="6">
          <a-input
            v-model="filter.keyword"
            :placeholder="t('promptTemplate.searchName')"
            allow-clear
          />
        </a-col>
        <a-col :span="6">
          <a-select
            v-model="filter.target_format"
            :placeholder="t('promptTemplate.filterFormat')"
            allow-clear
            style="width: 100%"
          >
            <a-option value="auto" label="auto" />
            <a-option value="anthropic" label="anthropic" />
            <a-option value="openai" label="openai" />
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-select
            v-model="filter.status"
            :placeholder="t('promptTemplate.filterStatus')"
            allow-clear
            style="width: 100%"
          >
            <a-option :value="'1'" :label="t('promptTemplate.statusEnabled')" />
            <a-option :value="'0'" :label="t('promptTemplate.statusDisabled')" />
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-space>
            <a-button type="primary" @click="applyFilter">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilter">{{ t('common.reset') }}</a-button>
          </a-space>
        </a-col>
      </a-row>

      <a-divider style="margin: 16px 0" />

      <!-- Toolbar -->
      <a-row justify="space-between" align="center" style="margin-bottom: 16px">
        <a-col>
          <span style="color: var(--color-text-3); font-size: 13px">
            {{ t('promptTemplate.totalTemplates', [filteredList.length]) }}
          </span>
        </a-col>
        <a-col>
          <a-space>
            <a-button
              v-if="userStore.hasPermission('template:create')"
              type="primary"
              @click="handleCreate"
            >
              <template #icon><icon-plus /></template>
              {{ t('promptTemplate.createTemplate') }}
            </a-button>
            <a-tooltip :content="t('common.refresh')">
              <a-button @click="fetchData">
                <template #icon><icon-refresh /></template>
              </a-button>
            </a-tooltip>
          </a-space>
        </a-col>
      </a-row>

      <!-- Table -->
      <a-table
        :data="filteredList"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        :bordered="false"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      >
        <template #columns>
          <a-table-column :title="t('promptTemplate.colName')" :width="180">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.name }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('promptTemplate.colFormat')" :width="110" align="center">
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ record.target_format }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('promptTemplate.colDescription')"
            data-index="description"
            :ellipsis="true"
            :tooltip="true"
          />

          <a-table-column :title="t('common.status')" :width="90" align="center">
            <template #cell="{ record }">
              <a-switch
                :model-value="record.status === 1"
                :disabled="!userStore.hasPermission('template:update')"
                @change="(v: string | number | boolean) => toggleStatus(record, !!v)"
              />
            </template>
          </a-table-column>

          <a-table-column :title="t('promptTemplate.colUpdatedAt')" :width="170">
            <template #cell="{ record }">
              <span style="color: var(--color-text-3)">{{ record.updated_at }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('common.actions')" :width="220" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button type="text" size="small" @click="openPreview(record)">
                  {{ t('promptTemplate.preview') }}
                </a-button>
                <a-button
                  v-if="userStore.hasPermission('template:update')"
                  type="text"
                  size="small"
                  @click="handleEdit(record)"
                >
                  {{ t('common.edit') }}
                </a-button>
                <a-popconfirm
                  v-if="userStore.hasPermission('template:delete')"
                  :content="t('promptTemplate.deleteConfirm')"
                  type="warning"
                  @ok="handleDelete(record)"
                >
                  <a-button type="text" size="small" status="danger">
                    {{ t('common.delete') }}
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- Drawer Form -->
    <a-drawer
      :visible="drawerVisible"
      :width="860"
      :title="isEdit ? t('promptTemplate.editTemplate') : t('promptTemplate.createTemplate')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="submit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="name" :label="t('promptTemplate.formName')">
          <a-input
            v-model="formData.name"
            :max-length="64"
            :placeholder="t('promptTemplate.formNamePh')"
          />
        </a-form-item>

        <a-form-item field="description" :label="t('promptTemplate.formDescription')">
          <a-textarea
            v-model="formData.description"
            :max-length="512"
            :placeholder="t('promptTemplate.formDescriptionPh')"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>

        <a-form-item field="system_prompt" :label="t('promptTemplate.formSystemPrompt')">
          <a-textarea
            v-model="formData.system_prompt"
            :placeholder="t('promptTemplate.formSystemPromptPh')"
            :auto-size="{ minRows: 4, maxRows: 12 }"
          />
          <template #extra>
            <span style="color: var(--color-text-3)">
              {{ t('promptTemplate.formSystemPromptHint') }}
            </span>
          </template>
        </a-form-item>

        <!-- Variables editor -->
        <a-form-item :label="t('promptTemplate.formVariables')">
          <template #extra>
            <span style="color: var(--color-text-3)">
              {{ t('promptTemplate.formVariablesHint') }}
            </span>
          </template>
          <div v-for="(v, idx) in variablesRows" :key="idx" class="var-row">
            <a-input
              v-model="v.name"
              class="var-name"
              :placeholder="t('promptTemplate.formVarNamePh')"
            />
            <a-select
              class="var-type"
              :model-value="v.type"
              @update:model-value="(val: unknown) => (v.type = val as TemplateVariableDef['type'])"
            >
              <a-option value="" label="string" />
              <a-option value="string" label="string" />
              <a-option value="number" label="number" />
              <a-option value="bool" label="bool" />
            </a-select>
            <a-checkbox
              class="var-check"
              :model-value="v.required"
              @change="(val: unknown) => (v.required = !!val)"
            >
              {{ t('promptTemplate.required') }}
            </a-checkbox>
            <a-checkbox
              class="var-check"
              :model-value="v.trusted"
              @change="(val: unknown) => (v.trusted = !!val)"
            >
              {{ t('promptTemplate.trusted') }}
            </a-checkbox>
            <a-input-number
              v-if="v.type === 'number'"
              class="var-default"
              :model-value="(v.default as number) ?? undefined"
              :placeholder="t('promptTemplate.formVarDefaultPh')"
              @change="(val: number | undefined) => (v.default = val)"
            />
            <a-switch
              v-else-if="v.type === 'bool'"
              :model-value="!!v.default"
              @change="(val: string | number | boolean) => (v.default = !!val)"
            />
            <a-input
              v-else
              class="var-default"
              :model-value="String(v.default ?? '')"
              :placeholder="t('promptTemplate.formVarDefaultPh')"
              @change="(val: string) => (v.default = val)"
            />
            <a-button type="text" status="danger" @click="removeVariable(idx)">
              <template #icon><icon-delete /></template>
            </a-button>
            <div v-if="varNameError(v, idx)" class="var-warn var-warn-error">
              {{ varNameError(v, idx) }}
            </div>
            <div v-else-if="isReservedName(v.name)" class="var-warn">
              {{ t('promptTemplate.warnReservedName') }}
            </div>
            <div v-else-if="!v.trusted" class="var-warn">
              {{ t('promptTemplate.warnUntrusted') }}
            </div>
          </div>
          <a-button long type="dashed" @click="addVariable">
            <template #icon><icon-plus /></template>
            {{ t('promptTemplate.addVariable') }}
          </a-button>
        </a-form-item>

        <!-- Few-shot editor -->
        <a-form-item :label="t('promptTemplate.formFewShot')">
          <template #extra>
            <span style="color: var(--color-text-3)">
              {{ t('promptTemplate.formFewShotHint') }}
            </span>
          </template>
          <div v-for="(m, idx) in fewShotRows" :key="idx" class="fewshot-row">
            <a-select
              class="fewshot-role"
              :model-value="m.role"
              @update:model-value="
                (val: unknown) => (m.role = val as TemplateFewShotMessage['role'])
              "
            >
              <a-option value="user" label="user" />
              <a-option value="assistant" label="assistant" />
            </a-select>
            <a-textarea
              v-model="m.content"
              class="fewshot-content"
              :placeholder="t('promptTemplate.formFewShotContentPh')"
              :auto-size="{ minRows: 1, maxRows: 4 }"
            />
            <a-button type="text" status="danger" @click="removeFewShot(idx)">
              <template #icon><icon-delete /></template>
            </a-button>
          </div>
          <a-button long type="dashed" @click="addFewShot">
            <template #icon><icon-plus /></template>
            {{ t('promptTemplate.addFewShot') }}
          </a-button>
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- Preview Modal -->
    <a-modal
      :visible="previewVisible"
      :width="720"
      :title="t('promptTemplate.previewTitle', { name: previewTemplate?.name ?? '' })"
      :footer="false"
      :mask-closable="false"
      unmount-on-close
      @cancel="closePreview"
    >
      <a-space direction="vertical" fill style="width: 100%">
        <span style="color: var(--color-text-3); font-size: 12px">
          {{ t('promptTemplate.previewHint') }}
        </span>

        <!-- Variable inputs -->
        <a-card v-if="previewVars.length" :bordered="false" size="small">
          <template #title>{{ t('promptTemplate.previewVariables') }}</template>
          <a-form :model="previewVarValues" layout="vertical">
            <a-form-item
              v-for="v in previewVars"
              :key="v.name"
              :field="v.name"
              :label="v.name + (v.required ? ' *' : '')"
            >
              <a-input-number
                v-if="v.type === 'number'"
                v-model="previewVarValues[v.name]"
                :placeholder="String(v.default ?? '')"
              />
              <a-switch v-else-if="v.type === 'bool'" v-model="previewVarValues[v.name]" />
              <a-input
                v-else
                v-model="previewVarValues[v.name]"
                :placeholder="String(v.default ?? '')"
              />
              <div v-if="isReservedName(v.name)" class="var-warn">
                {{ t('promptTemplate.warnReservedName') }}
              </div>
            </a-form-item>
          </a-form>
          <a-button type="primary" :loading="previewLoading" @click="runPreview">
            {{ t('promptTemplate.previewRun') }}
          </a-button>
        </a-card>

        <!-- Result -->
        <a-card v-if="previewResult" :bordered="false" size="small">
          <template #title>
            <a-space>
              <span>{{ t('promptTemplate.previewResult') }}</span>
              <a-button size="mini" type="text" @click="copy(previewResult.system_prompt)">
                {{ t('promptTemplate.copySystem') }}
              </a-button>
            </a-space>
          </template>
          <div style="margin-bottom: 12px">
            <a-tag color="purple">system</a-tag>
            <pre class="rendered">{{ previewResult.system_prompt }}</pre>
          </div>
          <div v-for="(m, idx) in previewResult.few_shot" :key="idx" style="margin-bottom: 8px">
            <a-tag :color="m.role === 'user' ? 'arcoblue' : 'green'">{{ m.role }}</a-tag>
            <pre class="rendered">{{ m.content }}</pre>
          </div>
        </a-card>
      </a-space>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { templateApi } from '@/api/template'
import { useCrud } from '@/composables/use-crud'
import { useLoading } from '@/hooks/loading'
import { useCopyWithFeedback } from '@/composables/use-copy-with-feedback'
import { useUserStore } from '@/store'
import type {
  PromptTemplate,
  PromptTemplateCreateRequest,
  TemplateVariableDef,
  TemplateFewShotMessage,
  RenderedContext,
} from '@/types'
import {
  isReservedName,
  isValidVariableName,
  coerceDefault,
  cleanPreviewValues,
  extractPreviewCode,
} from './template-helpers'

const { t } = useI18n()
const userStore = useUserStore()
const { copy } = useCopyWithFeedback()

// Map backend preview error code (substring before first ':' of the error text)
// to an i18n key. error_code is always "invalid_request"; the specific code only
// appears in the human-readable error string.
const PREVIEW_ERROR_KEYS: Record<string, string> = {
  missing_variable: 'promptTemplate.previewErrors.missing_variable',
  untrusted_var_in_system: 'promptTemplate.previewErrors.untrusted_var_in_system',
  value_too_large: 'promptTemplate.previewErrors.value_too_large',
  system_too_large: 'promptTemplate.previewErrors.system_too_large',
  type_mismatch: 'promptTemplate.previewErrors.type_mismatch',
  'invalid variables_schema': 'promptTemplate.previewErrors.invalid_schema',
  'invalid few_shot': 'promptTemplate.previewErrors.invalid_few_shot',
}

function parsePreviewError(text: string): string {
  const code = extractPreviewCode(text)
  const key = code ? PREVIEW_ERROR_KEYS[code] : ''
  return key ? t(key) : text || t('promptTemplate.previewErrors.fallback')
}

// ---------- CRUD ----------

const {
  loading,
  filteredList,
  drawerVisible,
  isEdit,
  submitLoading,
  formRef,
  formData,
  filter,
  pagination,
  fetchData,
  applyFilter,
  resetFilter,
  handleCreate,
  handleEdit,
  handleDrawerClose,
  handleDrawerSubmit,
  handleDelete,
  onPageChange,
  onPageSizeChange,
} = useCrud<PromptTemplate, { keyword?: string; target_format?: string; status?: string }>({
  fetchApi: templateApi.list,
  createApi: (data) => templateApi.create(data as PromptTemplateCreateRequest),
  updateApi: (id, data) => templateApi.update(id, data as Partial<PromptTemplateCreateRequest>),
  deleteApi: templateApi.delete,
  idField: 'id',
  fetchErrorMsg: t('promptTemplate.fetchFail'),
  deleteErrorMsg: t('common.deleteFail'),
  deleteSuccessMsg: t('promptTemplate.deleteSuccess'),
  updateSuccessMsg: t('promptTemplate.updateSuccess'),
  createSuccessMsg: t('promptTemplate.createSuccess'),
  errorCodeMap: { conflict: 'promptTemplate.nameConflict' },
  defaultForm: () => ({
    name: '',
    description: '',
    system_prompt: '',
    variables_schema: [],
    few_shot: [],
    target_format: 'auto',
    status: 1,
  }),
  filterFn: (item, f) => {
    let pass = true
    if (f.keyword) {
      const kw = f.keyword.toLowerCase()
      pass = pass && item.name.toLowerCase().includes(kw)
    }
    if (f.target_format) pass = pass && item.target_format === f.target_format
    if (f.status) pass = pass && String(item.status) === f.status
    return pass
  },
  transformPayload: (raw) => {
    const variables = (raw.variables_schema ?? [])
      .filter((v) => v.name && isValidVariableName(v.name))
      .map((v) => {
        const cleaned: TemplateVariableDef = {
          name: v.name,
          type: v.type,
          required: !!v.required,
          trusted: !!v.trusted,
        }
        const def = coerceDefault(v)
        if (def !== undefined) cleaned.default = def
        if (v.desc) cleaned.desc = v.desc
        return cleaned
      })
    const fewShot = (raw.few_shot ?? [])
      .filter((m) => m.role && m.content)
      .map((m) => ({ role: m.role, content: m.content }))
    return {
      name: raw.name as string,
      description: raw.description ?? '',
      system_prompt: raw.system_prompt ?? '',
      target_format: (raw.target_format as PromptTemplate['target_format']) || 'auto',
      variables_schema: variables,
      few_shot: fewShot,
    }
  },
})

const formRules = {
  name: [{ required: true, message: t('promptTemplate.formNameRequired') }],
}

// ---------- variable / few-shot editor ----------

// Normalize three-state (undefined|null|array) to a reactive array view bound to formData.
const variablesRows = computed({
  get: () => formData.variables_schema ?? [],
  set: (val: TemplateVariableDef[]) => {
    formData.variables_schema = val
  },
})
const fewShotRows = computed({
  get: () => formData.few_shot ?? [],
  set: (val: TemplateFewShotMessage[]) => {
    formData.few_shot = val
  },
})

function addVariable() {
  const next: TemplateVariableDef = { name: '', type: 'string', required: false, trusted: false }
  variablesRows.value = [...variablesRows.value, next]
}
function removeVariable(idx: number) {
  variablesRows.value = variablesRows.value.filter((_, i) => i !== idx)
}
function addFewShot() {
  const next: TemplateFewShotMessage = { role: 'user', content: '' }
  fewShotRows.value = [...fewShotRows.value, next]
}
function removeFewShot(idx: number) {
  fewShotRows.value = fewShotRows.value.filter((_, i) => i !== idx)
}

// Per-row validation: empty/format error, or duplicate name.
function varNameError(row: TemplateVariableDef, idx: number): string | null {
  if (!row.name) return t('promptTemplate.errVarNameEmpty')
  if (!isValidVariableName(row.name)) return t('promptTemplate.errVarNameFormat')
  const dup = variablesRows.value.findIndex((r) => r.name === row.name)
  if (dup !== -1 && dup !== idx) return t('promptTemplate.errVarNameDuplicate')
  return null
}

// Block submission if any variable row has an invalid/duplicate name.
function validateVariables(): string | null {
  const rows = variablesRows.value
  for (let i = 0; i < rows.length; i++) {
    const err = varNameError(rows[i], i)
    if (err) return err
  }
  return null
}

async function submit() {
  const varErr = validateVariables()
  if (varErr) {
    Message.error(varErr)
    return
  }
  await handleDrawerSubmit()
}

// ---------- inline status toggle (independent of useCrud) ----------

async function toggleStatus(record: PromptTemplate, on: boolean) {
  const next = on ? 1 : 0
  try {
    const res = await templateApi.update(record.id, { status: next })
    record.status = next
    if (res?.data?.updated_at) record.updated_at = res.data.updated_at
    Message.success(t('common.updateSuccess'))
  } catch {
    Message.error(t('common.operationFail'))
  }
}

// ---------- preview ----------

const { loading: previewLoading, setLoading: setPreviewLoading } = useLoading(false)
const previewVisible = ref(false)
const previewTemplate = ref<PromptTemplate | null>(null)
const previewVars = ref<TemplateVariableDef[]>([])
const previewVarValues = reactive<Record<string, unknown>>({})
const previewResult = ref<RenderedContext | null>(null)

function openPreview(record: PromptTemplate) {
  previewTemplate.value = record
  previewVars.value = (record.variables_schema ?? []) as TemplateVariableDef[]
  Object.keys(previewVarValues).forEach((k) => delete previewVarValues[k])
  for (const v of previewVars.value) {
    previewVarValues[v.name] = v.default ?? (v.type === 'bool' ? false : '')
  }
  previewResult.value = null
  previewVisible.value = true
}

function closePreview() {
  previewVisible.value = false
}

async function runPreview() {
  if (!previewTemplate.value) return
  const schema = previewVars.value
  // required check (front-end guard, avoid a pointless 400 round-trip)
  for (const v of schema) {
    if (v.required) {
      const val = previewVarValues[v.name]
      if (val === undefined || val === null || val === '') {
        Message.error(`${t('promptTemplate.previewErrors.missing_variable')}: ${v.name}`)
        return
      }
    }
  }
  const payload = cleanPreviewValues(schema, previewVarValues)
  setPreviewLoading(true)
  try {
    const res = await templateApi.preview(previewTemplate.value.id, payload)
    previewResult.value = res.data
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    Message.error(parsePreviewError(e?.response?.data?.error ?? ''))
  } finally {
    setPreviewLoading(false)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.template-page {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
.var-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--color-border-2);

  .var-name {
    width: 150px;
  }
  .var-type {
    width: 110px;
  }
  .var-check {
    flex-shrink: 0;
  }
  .var-default {
    flex: 1;
    min-width: 140px;
  }
  .var-warn {
    width: 100%;
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-3);
  }
  .var-warn-error {
    color: rgb(var(--red-6));
  }
}
.fewshot-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--color-border-2);

  .fewshot-role {
    width: 120px;
    flex-shrink: 0;
  }
  .fewshot-content {
    flex: 1;
  }
}
.rendered {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-text-1);
  background: var(--color-fill-2);
  padding: 8px;
  border-radius: 4px;
}
</style>

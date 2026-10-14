<template>
  <div class="safety-page">
    <!-- Global Config Panel -->
    <a-card class="general-card" style="margin-bottom: 16px">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="config" :header="t('safety.rules.configTitle')">
          <a-row :gutter="24" align="center">
            <a-col :span="6">
              <a-space direction="vertical" :size="4">
                <a-switch v-model="globalConfig.enabled" @change="handleConfigChange('enabled')" />
                <span style="font-weight: 600">{{ t('safety.rules.configEnabled') }}</span>
                <span style="color: var(--color-text-3); font-size: 12px">
                  {{ t('safety.rules.configEnabledTip') }}
                </span>
              </a-space>
            </a-col>
            <a-col :span="6">
              <a-space direction="vertical" :size="4">
                <a-switch
                  v-model="globalConfig.log_only"
                  @change="handleConfigChange('log_only')"
                />
                <span style="font-weight: 600">{{ t('safety.rules.configLogOnly') }}</span>
                <span style="color: var(--color-text-3); font-size: 12px">
                  {{ t('safety.rules.configLogOnlyTip') }}
                </span>
              </a-space>
            </a-col>
            <a-col :span="6">
              <a-space direction="vertical" :size="4">
                <a-switch
                  v-model="globalConfig.fail_open"
                  @change="handleConfigChange('fail_open')"
                />
                <span style="font-weight: 600">{{ t('safety.rules.configFailOpen') }}</span>
                <span style="color: var(--color-text-3); font-size: 12px">
                  {{ t('safety.rules.configFailOpenTip') }}
                </span>
              </a-space>
            </a-col>
            <a-col :span="6">
              <a-space direction="vertical" :size="4">
                <a-switch
                  v-model="globalConfig.strict_coverage"
                  @change="handleConfigChange('strict_coverage')"
                />
                <span style="font-weight: 600">{{ t('safety.rules.configStrictCoverage') }}</span>
                <span style="color: var(--color-text-3); font-size: 12px">
                  {{ t('safety.rules.configStrictCoverageTip') }}
                </span>
              </a-space>
            </a-col>
          </a-row>

          <a-divider style="margin: 12px 0" />

          <a-row :gutter="24" align="center">
            <a-col :span="8">
              <a-space direction="vertical" :size="4" fill>
                <span style="font-weight: 600">{{ t('safety.rules.configStreamMode') }}</span>
                <a-select
                  :model-value="globalConfig.stream_mode"
                  :placeholder="t('common.default')"
                  allow-clear
                  @change="handleConfigSelect('stream_mode', $event)"
                  @clear="handleConfigClear('stream_mode')"
                >
                  <a-option value="window" :label="t('safety.rules.streamModeWindow')" />
                  <a-option value="strict" :label="t('safety.rules.streamModeStrict')" />
                </a-select>
                <span style="color: var(--color-text-3); font-size: 12px">
                  {{ t('safety.rules.configStreamModeTip') }}
                </span>
              </a-space>
            </a-col>
            <a-col :span="8">
              <a-space direction="vertical" :size="4" fill>
                <span style="font-weight: 600">{{ t('safety.rules.configOversizeAction') }}</span>
                <a-select
                  :model-value="globalConfig.oversize_action"
                  :placeholder="t('common.default')"
                  allow-clear
                  @change="handleConfigSelect('oversize_action', $event)"
                  @clear="handleConfigClear('oversize_action')"
                >
                  <a-option value="truncate" :label="t('safety.rules.oversizeTruncate')" />
                  <a-option value="reject" :label="t('safety.rules.oversizeReject')" />
                </a-select>
                <span style="color: var(--color-text-3); font-size: 12px">
                  {{ t('safety.rules.configOversizeActionTip') }}
                </span>
              </a-space>
            </a-col>
            <a-col :span="8">
              <a-space direction="vertical" :size="4" fill>
                <span style="font-weight: 600">
                  {{ t('safety.rules.configEngineErrorAction') }}
                </span>
                <a-select
                  :model-value="globalConfig.engine_error_action"
                  :placeholder="t('common.default')"
                  allow-clear
                  @change="handleConfigSelect('engine_error_action', $event)"
                  @clear="handleConfigClear('engine_error_action')"
                >
                  <a-option value="skip" :label="t('safety.rules.engineErrorSkip')" />
                  <a-option value="block" :label="t('safety.rules.engineErrorBlock')" />
                </a-select>
                <span style="color: var(--color-text-3); font-size: 12px">
                  {{ t('safety.rules.configEngineErrorActionTip') }}
                </span>
              </a-space>
            </a-col>
          </a-row>

          <a-divider style="margin: 12px 0" />

          <a-row :gutter="24" align="center">
            <a-col :span="4">
              <a-space direction="vertical" :size="4" fill>
                <span style="font-weight: 600">
                  {{ t('safety.rules.configStrictMaxRunes') }}
                </span>
                <a-input-number
                  :model-value="globalConfig.stream_strict_max_runes"
                  :min="1"
                  hide-button
                  @change="handleConfigNumber('stream_strict_max_runes', $event)"
                />
              </a-space>
            </a-col>
            <a-col :span="4">
              <a-space direction="vertical" :size="4" fill>
                <span style="font-weight: 600">
                  {{ t('safety.rules.configStrictMaxBytes') }}
                </span>
                <a-input-number
                  :model-value="globalConfig.stream_strict_max_bytes"
                  :min="1"
                  hide-button
                  @change="handleConfigNumber('stream_strict_max_bytes', $event)"
                />
              </a-space>
            </a-col>
            <a-col :span="4">
              <a-space direction="vertical" :size="4" fill>
                <span style="font-weight: 600">
                  {{ t('safety.rules.configStrictMaxEvents') }}
                </span>
                <a-input-number
                  :model-value="globalConfig.stream_strict_max_events"
                  :min="1"
                  hide-button
                  @change="handleConfigNumber('stream_strict_max_events', $event)"
                />
              </a-space>
            </a-col>
            <a-col :span="4">
              <a-space direction="vertical" :size="4" fill>
                <span style="font-weight: 600">{{ t('safety.rules.configRequestBudget') }}</span>
                <a-input-number
                  :model-value="globalConfig.request_budget_ms"
                  :min="1"
                  hide-button
                  @change="handleConfigNumber('request_budget_ms', $event)"
                />
              </a-space>
            </a-col>
            <a-col :span="4">
              <a-space direction="vertical" :size="4" fill>
                <span style="font-weight: 600">{{ t('safety.rules.configResponseBudget') }}</span>
                <a-input-number
                  :model-value="globalConfig.response_budget_ms"
                  :min="1"
                  hide-button
                  @change="handleConfigNumber('response_budget_ms', $event)"
                />
              </a-space>
            </a-col>
          </a-row>
        </a-collapse-item>
      </a-collapse>
    </a-card>

    <!-- Main Rules Card -->
    <a-card class="general-card">
      <template #title>{{ t('safety.rules.title') }}</template>

      <!-- Search / Filter -->
      <a-row :gutter="16" align="center">
        <a-col :span="6">
          <a-input
            v-model="filter.keyword"
            :placeholder="t('safety.rules.searchName')"
            allow-clear
          />
        </a-col>
        <a-col :span="5">
          <a-select
            v-model="filter.type"
            :placeholder="t('safety.rules.filterType')"
            allow-clear
            style="width: 100%"
          >
            <a-option
              v-for="key in engineTypeOptions"
              :key="key"
              :value="key"
              :label="t(`safety.engineType.${key}`)"
            />
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-select
            v-model="filter.enabled"
            :placeholder="t('safety.rules.filterStatus')"
            allow-clear
            style="width: 100%"
          >
            <a-option value="true" :label="t('common.enabled')" />
            <a-option value="false" :label="t('common.disabled')" />
          </a-select>
        </a-col>
        <a-col :span="8">
          <a-space>
            <a-button type="primary" @click="applyFilter">{{ t('common.search') }}</a-button>
            <a-button @click="resetFilter">{{ t('common.reset') }}</a-button>
            <a-button type="primary" @click="handleCreate">
              <template #icon><icon-plus /></template>
              {{ t('safety.rules.createRule') }}
            </a-button>
            <a-tooltip :content="t('common.refresh')">
              <a-button @click="fetchData">
                <template #icon><icon-refresh /></template>
              </a-button>
            </a-tooltip>
          </a-space>
        </a-col>
      </a-row>

      <a-divider style="margin: 16px 0" />

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
          <a-table-column :title="t('safety.rules.formName')" data-index="name" :width="160">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.name }}</span>
              <span class="rule-version">v{{ record.version }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.rules.formType')"
            data-index="type"
            :width="150"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ t(`safety.engineType.${record.type}`) }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.rules.formDirection')"
            data-index="direction"
            :width="100"
            align="center"
          >
            <template #cell="{ record }">
              {{ t(`safety.direction.${record.direction}`) }}
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.rules.formSeverity')"
            data-index="severity"
            :width="100"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag :color="severityColor(record.severity)">
                {{ t(`safety.severity.${record.severity}`) }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('safety.rules.formAction')"
            data-index="action"
            :width="100"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag :color="actionColor(record.action)">
                {{ t(`safety.action.${record.action}`) }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('common.status')"
            data-index="enabled"
            :width="80"
            align="center"
          >
            <template #cell="{ record }">
              <a-switch
                :model-value="record.enabled"
                size="small"
                @change="handleToggleEnabled(record)"
              />
            </template>
          </a-table-column>

          <a-table-column :title="t('common.actions')" :width="250" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button type="text" size="small" @click="handleEdit(record)">
                  {{ t('common.edit') }}
                </a-button>
                <a-button type="text" size="small" @click="handleTest(record)">
                  {{ t('safety.rules.testName') }}
                </a-button>
                <a-button type="text" size="small" @click="handleHistory(record)">
                  {{ t('safety.rules.history') }}
                </a-button>
                <a-popconfirm
                  :content="t('safety.rules.deleteConfirm')"
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
      :width="560"
      :title="isEdit ? t('safety.rules.editRule') : t('safety.rules.createRule')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="name" :label="t('safety.rules.formName')">
          <a-input v-model="formData.name" :placeholder="t('safety.rules.formName')" />
        </a-form-item>

        <a-form-item field="type" :label="t('safety.rules.formType')">
          <a-select
            v-model="formData.type"
            :placeholder="t('safety.rules.formType')"
            :disabled="isEdit"
          >
            <a-option
              v-for="key in engineTypeOptions"
              :key="key"
              :value="key"
              :label="t(`safety.engineType.${key}`)"
            />
          </a-select>
        </a-form-item>

        <a-form-item field="direction" :label="t('safety.rules.formDirection')">
          <a-radio-group v-model="formData.direction">
            <a-radio value="request">{{ t('safety.direction.request') }}</a-radio>
            <a-radio value="response">{{ t('safety.direction.response') }}</a-radio>
            <a-radio value="both">{{ t('safety.direction.both') }}</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="severity" :label="t('safety.rules.formSeverity')">
              <a-select v-model="formData.severity">
                <a-option value="low" :label="t('safety.severity.low')" />
                <a-option value="medium" :label="t('safety.severity.medium')" />
                <a-option value="high" :label="t('safety.severity.high')" />
                <a-option value="critical" :label="t('safety.severity.critical')" />
              </a-select>
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="action" :label="t('safety.rules.formAction')">
              <a-select v-model="formData.action">
                <a-option value="block" :label="t('safety.action.block')" />
                <a-option value="log" :label="t('safety.action.log')" />
                <a-option value="mask" :label="t('safety.action.mask')" />
              </a-select>
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-form-item field="config" :label="t('safety.rules.formConfig')">
          <engine-config-editor
            v-model="formData.config"
            :engine-type="formData.type as GuardrailEngineType"
          />
        </a-form-item>

        <a-form-item field="model_filter" :label="t('safety.rules.formModelFilter')">
          <a-select
            v-model="modelFilterTags"
            :placeholder="t('safety.rules.formModelFilterPh')"
            multiple
            allow-clear
            allow-search
            :allow-create="true"
            :filterable="true"
          >
            <a-option v-for="name in modelOptions" :key="name" :value="name" :label="name" />
          </a-select>
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- Test Modal -->
    <a-modal
      v-model:visible="testModalVisible"
      :title="t('safety.rules.testName')"
      :width="520"
      :ok-loading="testLoading"
      :mask-closable="false"
      @ok="executeTest"
      @cancel="testModalVisible = false"
    >
      <a-space direction="vertical" fill style="width: 100%">
        <a-textarea
          v-model="testInput"
          :placeholder="t('safety.rules.testInput')"
          :auto-size="{ minRows: 3, maxRows: 6 }"
        />
        <a-card
          v-if="testResult"
          :title="t('safety.rules.testResult')"
          :bordered="false"
          size="small"
        >
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item :label="t('common.status')">
              <a-tag :color="testResult.blocked ? 'red' : 'green'">
                {{ testResult.blocked ? t('safety.rules.blocked') : t('safety.rules.passed') }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item v-if="testResult.rule_name" :label="t('safety.rules.formName')">
              {{ testResult.rule_name }}
            </a-descriptions-item>
            <a-descriptions-item v-if="testResult.reason" :label="t('safety.alerts.reason')">
              {{ testResult.reason }}
            </a-descriptions-item>
            <a-descriptions-item v-if="testResult.severity" :label="t('safety.rules.formSeverity')">
              <a-tag :color="severityColor(testResult.severity)">
                {{ t(`safety.severity.${testResult.severity}`) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item v-if="testResult.masked_content" :label="t('safety.action.mask')">
              {{ testResult.masked_content }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-space>
    </a-modal>

    <!-- Version History Drawer (append-only snapshots; rollback restores as a NEW version) -->
    <a-drawer
      :visible="historyVisible"
      :width="640"
      :title="t('safety.rules.historyTitle', { name: historyRule?.name ?? '' })"
      unmount-on-close
      :footer="false"
      @cancel="historyVisible = false"
    >
      <a-alert style="margin-bottom: 12px">
        {{ t('safety.rules.currentVersion') }}: v{{ historyCurrentVersion }}
      </a-alert>
      <a-table
        :data="historyList"
        :loading="historyLoading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #columns>
          <a-table-column
            :title="t('safety.rules.colVersion')"
            data-index="version"
            :width="80"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag v-if="record.version === historyCurrentVersion" color="arcoblue">
                v{{ record.version }}
              </a-tag>
              <span v-else>v{{ record.version }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('safety.rules.colChangeKind')" :width="90" align="center">
            <template #cell="{ record }">
              <a-tag :color="changeKindColor(record.change_kind)">
                {{ t(`safety.rules.changeKind.${record.change_kind}`) }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column :title="t('safety.rules.colActor')" data-index="actor" :width="120">
            <template #cell="{ record }">
              {{ record.actor || '-' }}
            </template>
          </a-table-column>

          <a-table-column :title="t('safety.rules.colTime')" :width="170">
            <template #cell="{ record }">
              {{ formatTime(record.created_at) }}
            </template>
          </a-table-column>

          <a-table-column :title="t('common.actions')" :width="130" align="center">
            <template #cell="{ record }">
              <!-- A delete snapshot documents removal — it is not a restorable state. -->
              <a-tooltip
                v-if="record.change_kind === 'delete'"
                :content="t('safety.rules.notRollbackable')"
              >
                <a-button type="text" size="small" disabled>
                  {{ t('safety.rules.rollback') }}
                </a-button>
              </a-tooltip>
              <a-popconfirm
                v-else-if="record.version !== historyCurrentVersion"
                :content="t('safety.rules.rollbackConfirm')"
                type="warning"
                @ok="handleRollback(record)"
              >
                <a-button type="text" size="small">
                  {{ t('safety.rules.rollback') }}
                </a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { guardrailApi } from '@/api/safety'
import { modelApi } from '@/api/model'
import { useCrud } from '@/composables/use-crud'
import { logger } from '@/logger'
import { useLoading } from '@/hooks/loading'
import { getDefaultsForEngine } from './engine-schema'
import type {
  GuardrailRule,
  GuardrailRuleVersion,
  GuardrailConfig,
  GuardrailTestResult,
  GuardrailEngineType,
} from '@/types'
import { formatTime } from '@/utils/format'
import EngineConfigEditor from './components/engine-config-editor.vue'

const { t } = useI18n()

// Engine type options
const engineTypeOptions: GuardrailEngineType[] = [
  'keyword_filter',
  'pii_detection',
  'prompt_injection',
  'credential_detection',
  'openai_moderation',
  'content_length',
  'agent_fingerprint',
  'behavior_analysis',
  'webhook',
]

// Model list for model_filter selector
const modelOptions = ref<string[]>([])

async function fetchModels() {
  try {
    const res = await modelApi.list()
    modelOptions.value = [...new Set(res.data.map((m: any) => m.model_name))].sort()
  } catch (e) {
    // Non-critical: model dropdown is best-effort, but surface the failure in the debug log.
    logger.warn('Failed to load model options', e, 'app')
  }
}

// Convert between comma-separated string (backend) and string array (multi-select)
const modelFilterTags = computed({
  get: () => {
    const val = formData.model_filter
    if (!val) return []
    return val
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
  },
  set: (arr: string[]) => {
    formData.model_filter = arr.join(',')
  },
})

// Global config
const globalConfig = ref<GuardrailConfig>({
  enabled: true,
  log_only: false,
  fail_open: false,
})

async function fetchConfig() {
  try {
    const res = await guardrailApi.getConfig()
    globalConfig.value = res.data
  } catch {
    // silently fail — config panel will show defaults
  }
}

async function handleConfigChange(key: keyof GuardrailConfig) {
  try {
    await guardrailApi.updateConfig({ [key]: globalConfig.value[key] } as Partial<GuardrailConfig>)
    Message.success(t('common.updateSuccess'))
  } catch {
    Message.error(t('common.operationFail'))
    // Revert by re-fetching
    await fetchConfig()
  }
}

// Select 类配置项：后端只接受枚举值，清空（undefined）不发送请求
function handleConfigSelect(
  key: 'stream_mode' | 'oversize_action' | 'engine_error_action',
  value: string | number | boolean | undefined,
) {
  if (value === undefined || value === null || value === '') {
    handleConfigClear(key)
    return
  }
  globalConfig.value[key] = value as never
  handleConfigChange(key)
}

// 清空 = 恢复服务端值（后端无“未设置”语义，不做 PUT）
async function handleConfigClear(_key: 'stream_mode' | 'oversize_action' | 'engine_error_action') {
  await fetchConfig()
}

// 数字类配置项：后端要求正整数，空值不发送请求并回填服务端值
function handleConfigNumber(
  key:
    | 'stream_strict_max_runes'
    | 'stream_strict_max_bytes'
    | 'stream_strict_max_events'
    | 'request_budget_ms'
    | 'response_budget_ms',
  value: number | undefined,
) {
  if (value === undefined || value === null) {
    fetchConfig()
    return
  }
  globalConfig.value[key] = value
  handleConfigChange(key)
}

// useCrud setup
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
} = useCrud<GuardrailRule, { keyword?: string; type?: string; enabled?: string }>({
  fetchApi: guardrailApi.list,
  createApi: guardrailApi.create,
  updateApi: guardrailApi.update,
  deleteApi: guardrailApi.delete,
  idField: 'id',
  fetchErrorMsg: t('common.operationFail'),
  deleteErrorMsg: t('common.deleteFail'),
  deleteSuccessMsg: t('safety.rules.deleteRule'),
  updateSuccessMsg: t('common.updateSuccess'),
  createSuccessMsg: t('common.operationSuccess'),
  defaultForm: () => ({
    name: '',
    type: 'keyword_filter',
    direction: 'both',
    enabled: true,
    config: getDefaultsForEngine('keyword_filter'),
    severity: 'medium',
    action: 'block',
    model_filter: '',
  }),
  filterFn: (item, f) => {
    let pass = true
    if (f.keyword) pass = pass && item.name.toLowerCase().includes(f.keyword.toLowerCase())
    if (f.type) pass = pass && item.type === f.type
    if (f.enabled) pass = pass && String(item.enabled) === f.enabled
    return pass
  },
  // 乐观锁：并发修改返回 409 version_conflict，提示用户刷新后重试
  errorCodeMap: {
    version_conflict: 'safety.rules.versionConflict',
  },
})

const formRules = {
  name: [{ required: true, message: t('safety.rules.formName') }],
  type: [{ required: true, message: t('safety.rules.formType') }],
  direction: [{ required: true, message: t('safety.rules.formDirection') }],
}

// Reset config when engine type changes (create mode only)
watch(
  () => formData.type,
  (newType, oldType) => {
    if (!isEdit.value && newType !== oldType && newType) {
      formData.config = getDefaultsForEngine(newType as GuardrailEngineType)
    }
  },
)

// Inline enabled toggle (bypass useCrud)
async function handleToggleEnabled(record: GuardrailRule) {
  try {
    await guardrailApi.update(record.id, { enabled: !record.enabled })
    record.enabled = !record.enabled
  } catch (err: unknown) {
    const code = (err as { response?: { data?: { error_code?: string } } })?.response?.data
      ?.error_code
    if (code === 'version_conflict') {
      Message.error(t('safety.rules.versionConflict'))
      // 列表里的 version 已过期，重新拉取
      await fetchData()
    } else {
      Message.error(t('common.operationFail'))
    }
  }
}

// Version history drawer (append-only snapshots served sanitized by the backend)
const historyVisible = ref(false)
const historyLoading = ref(false)
const historyRule = ref<GuardrailRule | null>(null)
const historyList = ref<GuardrailRuleVersion[]>([])
const historyCurrentVersion = ref(0)

async function handleHistory(record: GuardrailRule) {
  historyRule.value = record
  historyVisible.value = true
  historyLoading.value = true
  try {
    const res = await guardrailApi.versions(record.id)
    historyList.value = res.data
    historyCurrentVersion.value = res.current_version
  } catch {
    Message.error(t('common.operationFail'))
  } finally {
    historyLoading.value = false
  }
}

async function handleRollback(record: GuardrailRuleVersion) {
  if (!historyRule.value) return
  try {
    await guardrailApi.rollback(historyRule.value.id, { to_version: record.version })
    Message.success(t('safety.rules.rollbackSuccess'))
    // 回滚以新版本落库 — 刷新历史与规则列表
    await handleHistory(historyRule.value)
    await fetchData()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error_code?: string; error?: string } } }
    Message.error(
      e?.response?.data?.error_code === 'version_conflict'
        ? t('safety.rules.versionConflict')
        : e?.response?.data?.error || t('common.operationFail'),
    )
  }
}

function changeKindColor(kind: string): string {
  const map: Record<string, string> = {
    create: 'green',
    update: 'blue',
    delete: 'red',
    rollback: 'orange',
    migrate: 'gray',
  }
  return map[kind] || 'blue'
}

// Severity & action tag colors
function severityColor(severity: string): string {
  const map: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'purple',
  }
  return map[severity] || 'blue'
}

function actionColor(action: string): string {
  const map: Record<string, string> = {
    block: 'red',
    log: 'blue',
    mask: 'orange',
  }
  return map[action] || 'blue'
}

// Test modal
const testModalVisible = ref(false)
const testingRule = ref<GuardrailRule | null>(null)
const testInput = ref('')
const testResult = ref<GuardrailTestResult | null>(null)
const { loading: testLoading, setLoading: setTestLoading } = useLoading()

function handleTest(record: GuardrailRule) {
  testingRule.value = record
  testInput.value = ''
  testResult.value = null
  testModalVisible.value = true
}

async function executeTest() {
  if (!testingRule.value || !testInput.value.trim()) {
    Message.warning(t('safety.rules.testInput'))
    return
  }
  setTestLoading(true)
  try {
    const res = await guardrailApi.test(testingRule.value.id, testInput.value)
    testResult.value = res.data
  } catch {
    Message.error(t('common.operationFail'))
  } finally {
    setTestLoading(false)
  }
}

onMounted(() => {
  fetchData()
  fetchConfig()
  fetchModels()
})
</script>

<style scoped lang="less">
.safety-page {
  :deep(.arco-table) {
    font-size: 13px;
  }

  .rule-version {
    margin-left: 6px;
    color: var(--color-text-3);
    font-size: 12px;
    font-weight: 400;
  }
}
</style>

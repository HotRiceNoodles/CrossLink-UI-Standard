<template>
  <div class="key-page">
    <a-card class="general-card">
      <template #title>{{ t('key.title') }}</template>

      <!-- Search / Filter -->
      <a-row :gutter="16" align="center">
        <a-col :span="6">
          <a-select
            v-model="filter.status"
            :placeholder="t('key.statusPlaceholder')"
            allow-clear
            style="width: 100%"
          >
            <a-option :value="1" :label="t('common.enabled')" />
            <a-option :value="0" :label="t('common.disabled')" />
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-input v-model="filter.keyword" :placeholder="t('key.searchName')" allow-clear />
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
            {{ t('key.totalKeys', [filteredList.length]) }}
          </span>
        </a-col>
        <a-col>
          <a-space>
            <a-button type="primary" @click="openCreate">
              <template #icon><icon-plus /></template>
              {{ t('key.createKey') }}
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
          <a-table-column :title="t('key.tableName')" data-index="name" :width="160">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.name }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('key.tablePrefix')"
            data-index="key_prefix"
            :width="120"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag color="arcoblue" style="font-family: monospace">
                {{ record.key_prefix }}...
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('key.tableStatus')"
            data-index="status"
            :width="90"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag v-if="record.status === 1" color="green">
                {{ t('common.enabled') }}
              </a-tag>
              <a-tag v-else-if="record.status === 2" color="gray" size="small">
                {{ t('key.expired') }}
              </a-tag>
              <a-tag v-else color="red">
                {{ t('common.disabled') }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column :title="t('key.tableExpiresAt')" :width="140">
            <template #cell="{ record }">
              <span v-if="!record.expires_at" style="color: var(--color-text-4)">
                {{ t('key.permanent') }}
              </span>
              <a-tag v-else-if="isExpired(record)" color="red" size="small">
                {{ t('key.expired') }}
              </a-tag>
              <template v-else>
                <a-tag v-if="daysLeft(record) <= 7" color="orange" size="small">
                  {{ t('key.expiresSoon', { n: daysLeft(record) }) }}
                </a-tag>
                <span v-else>{{ dayjs(record.expires_at).format('YYYY-MM-DD') }}</span>
              </template>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('key.tableAllowedModels')"
            :width="200"
            :ellipsis="true"
            :tooltip="true"
          >
            <template #cell="{ record }">
              <template v-if="record.allowed_models?.length">
                {{ record.allowed_models.join(', ') }}
              </template>
              <span v-else style="color: var(--color-text-3)">{{ t('key.allModels') }}</span>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('key.tableTpm')"
            data-index="tpm_limit"
            :width="80"
            align="right"
          >
            <template #cell="{ record }">
              {{ record.tpm_limit || t('common.unlimited') }}
            </template>
          </a-table-column>

          <a-table-column
            :title="t('key.tableRpm')"
            data-index="rpm_limit"
            :width="80"
            align="right"
          >
            <template #cell="{ record }">
              {{ record.rpm_limit || t('common.unlimited') }}
            </template>
          </a-table-column>

          <a-table-column :title="t('key.tableBudget')" :width="120" align="right">
            <template #cell="{ record }">
              <template v-if="record.max_budget">
                {{ getCurrencySymbol() }}{{ record.max_budget }} /
                {{ budgetPeriodLabel(record.budget_period) }}
              </template>
              <span v-else style="color: var(--color-text-3)">-</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('key.tableCallCount')" :width="120" align="right">
            <template #cell="{ record }">
              <template v-if="record.max_calls">
                {{ record.max_calls }} / {{ callPeriodLabel(record.call_period) }}
              </template>
              <span v-else style="color: var(--color-text-3)">-</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('key.tableCreatedAt')" data-index="created_at" :width="150">
            <template #cell="{ record }">
              {{ formatTime(record.created_at) }}
            </template>
          </a-table-column>

          <a-table-column :title="t('key.tableLastUsed')" data-index="last_used_at" :width="150">
            <template #cell="{ record }">
              <template v-if="record.last_used_at">
                {{ dayjs(record.last_used_at).format('YYYY-MM-DD') }}
              </template>
              <span v-else style="color: var(--color-text-4); font-style: italic">
                {{ t('key.neverUsed') }}
              </span>
            </template>
          </a-table-column>

          <a-table-column :title="t('common.actions')" :width="240" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button type="text" size="small" @click="openEdit(record)">
                  {{ t('common.edit') }}
                </a-button>
                <a-popconfirm
                  :content="t('key.regenerateConfirm')"
                  type="warning"
                  @ok="handleRegenerate(record)"
                >
                  <a-button type="text" size="small" style="color: rgb(var(--warning-6))">
                    {{ t('key.regenerate') }}
                  </a-button>
                </a-popconfirm>
                <a-popconfirm
                  :content="t('key.deleteConfirm')"
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
      :title="isEdit ? t('key.editKey') : t('key.createKey')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="name" :label="t('key.nameLabel')">
          <a-input
            v-model="formData.name"
            :placeholder="t('key.namePlaceholder')"
            :disabled="isEdit"
          />
        </a-form-item>

        <a-form-item field="allowed_models" :label="t('key.allowedModelsLabel')">
          <a-select
            v-model="formData.allowed_models"
            :placeholder="t('key.allowedModelsPlaceholder')"
            multiple
            allow-create
            allow-clear
            :filterable="true"
          >
            <a-option v-for="name in modelOptions" :key="name" :value="name" :label="name" />
          </a-select>
        </a-form-item>

        <a-form-item field="allowed_routes" :label="t('key.allowedRoutesLabel')">
          <a-select
            v-model="formData.allowed_routes"
            :placeholder="t('key.allowedRoutesPlaceholder')"
            multiple
            allow-clear
          >
            <a-option value="openai" label="OpenAI" />
            <a-option value="anthropic" label="Anthropic" />
          </a-select>
        </a-form-item>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="tpm_limit" :label="t('key.tpmLimitLabel')">
              <a-input-number
                v-model="formData.tpm_limit"
                :min="0"
                :placeholder="t('key.limitPlaceholder')"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="rpm_limit" :label="t('key.rpmLimitLabel')">
              <a-input-number
                v-model="formData.rpm_limit"
                :min="0"
                :placeholder="t('key.limitPlaceholder')"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="max_budget" :label="t('key.budgetLimitLabel')">
              <a-input-number
                v-model="formData.max_budget"
                :min="0"
                :precision="2"
                :placeholder="t('key.budgetPlaceholder')"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="budget_period" :label="t('key.budgetPeriodLabel')">
              <a-select
                v-model="formData.budget_period"
                :placeholder="t('key.budgetPeriodPlaceholder')"
              >
                <a-option value="daily" :label="t('key.periodDaily')" />
                <a-option value="weekly" :label="t('key.periodWeekly')" />
                <a-option value="monthly" :label="t('key.periodMonthly')" />
              </a-select>
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="max_calls" :label="t('key.callLimitLabel')">
              <a-input-number
                v-model="formData.max_calls"
                :min="0"
                :placeholder="t('key.callPlaceholder')"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="call_period" :label="t('key.callPeriodLabel')">
              <a-select
                v-model="formData.call_period"
                :placeholder="t('key.callPeriodPlaceholder')"
              >
                <a-option value="daily" :label="t('key.periodDaily')" />
                <a-option value="weekly" :label="t('key.periodWeekly')" />
                <a-option value="monthly" :label="t('key.periodMonthly')" />
              </a-select>
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-form-item field="expires_at" :label="t('key.expiresAtLabel')">
          <div class="expire-row">
            <a-select
              v-model="expirePreset"
              class="expire-row__preset"
              :class="{ 'expire-row__preset--narrow': expirePreset === 'custom' }"
              :placeholder="t('key.expiresAtLabel')"
              @change="onExpirePresetChange"
            >
              <a-option
                v-for="opt in expireOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </a-select>
            <a-date-picker
              v-if="expirePreset === 'custom'"
              v-model="formData.expires_at"
              class="expire-row__picker"
              show-time
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm"
              :disabled-date="(current: Date) => dayjs(current).isBefore(dayjs().startOf('day'))"
              @change="onExpireDateChange"
            />
          </div>
        </a-form-item>

        <a-form-item v-if="isEdit" field="status" :label="t('common.status')">
          <a-select v-model="formData.status">
            <a-option :value="1" :label="t('common.enabled')" />
            <a-option :value="0" :label="t('common.disabled')" />
          </a-select>
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- Key Created Modal -->
    <a-modal
      v-model:visible="keyModalVisible"
      :title="t('key.keyCreatedTitle')"
      :mask-closable="false"
      :closable="false"
      :footer="false"
      :width="520"
    >
      <a-alert type="warning" :closable="false" style="margin-bottom: 16px">
        {{ t('key.keyCreatedWarning') }}
      </a-alert>
      <a-input :model-value="createdKey" readonly style="font-family: monospace" />
      <div style="margin-top: 16px; text-align: end">
        <a-space>
          <a-button v-if="copyFailed" @click="confirmCopied">
            {{ t('key.confirmedCopied') }}
          </a-button>
          <a-button type="primary" @click="copyAndClose">{{ t('key.copyAndClose') }}</a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { keyApi } from '@/api/key'
import { modelApi } from '@/api/model'
import { useCrud } from '@/composables/use-crud'
import { formatTime } from '@/utils/format'
import { getCurrencySymbol } from '@/utils/currency'
import { copyToClipboard } from '@/utils/clipboard'
import type { APIKey } from '@/types'

const { t } = useI18n()

// Auxiliary data
const modelOptions = ref<string[]>([])

// 过期时间预设：'never' 仅创建态可选；编辑态去除，因后端无法把已存在的过期时间清回 null。
const expirePreset = ref<string>('never')

// Key reveal modal (unique to this view)
const keyModalVisible = ref(false)
const createdKey = ref('')
const copyFailed = ref(false)

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
  hideDrawer,
  onPageChange,
  onPageSizeChange,
} = useCrud<APIKey, { status?: number; keyword: string }>({
  fetchApi: keyApi.list,
  createApi: keyApi.create,
  updateApi: keyApi.update,
  deleteApi: keyApi.delete,
  idField: 'id',
  fetchErrorMsg: t('key.fetchKeyListFail'),
  deleteErrorMsg: t('common.deleteFail'),
  deleteSuccessMsg: t('key.keyDeleted'),
  updateSuccessMsg: t('key.keyUpdateSuccess'),
  defaultForm: () => ({
    name: '',
    allowed_models: [],
    allowed_routes: [],
    tpm_limit: 0,
    rpm_limit: 0,
    max_budget: null,
    budget_period: 'monthly',
    max_calls: 0,
    call_period: 'daily',
    expires_at: null,
    status: 1,
  }),
  filterFn: (item, f) => {
    let pass = true
    if (f.status !== undefined && f.status !== null) pass = pass && item.status === f.status
    if (f.keyword) {
      const kw = (f.keyword as string).toLowerCase()
      pass = pass && (item.name as string).toLowerCase().includes(kw)
    }
    return pass
  },
  onCreated: async (responseData) => {
    hideDrawer()
    createdKey.value = (responseData as { key: string }).key
    keyModalVisible.value = true
  },
  transformPayload: (raw, edit) => {
    const payload = { ...raw } as Record<string, unknown>
    const preset = expirePreset.value
    const noExpiry = preset === 'never' || preset === ''
    if (noExpiry) {
      // 创建态：显式 null → 永久；编辑态：后端会忽略 null，故直接不带此字段，保持原值。
      if (edit) delete payload.expires_at
      else payload.expires_at = null
    } else if (payload.expires_at) {
      // 自定义/快捷预设的本地时间串 → ISO8601，后端按 RFC3339 解析。
      payload.expires_at = dayjs(payload.expires_at as string).toISOString()
    } else {
      delete payload.expires_at
    }
    // 编辑过期密钥（status=2）并把过期时间延到未来 → 自动重新启用(1)。
    // 后端虽有同样逻辑，但仅当 status==nil 时触发；前端编辑态始终带 status，故这里显式置 1。
    if (
      edit &&
      payload.expires_at &&
      payload.status === 2 &&
      dayjs(payload.expires_at as string).isAfter(dayjs())
    ) {
      payload.status = 1
    }
    return payload as Partial<APIKey>
  },
  // 后端 error_code → i18n 键，错误 toast 不再显示英文原文
  errorCodeMap: {
    invalid_request: 'key.errorInvalidRequest',
    invalid_id: 'key.errorInvalidId',
    key_not_found: 'key.errorNotFound',
    budget_period_invalid: 'key.errorBudgetPeriod',
    budget_negative: 'key.errorBudgetNegative',
    insufficient_permissions: 'key.errorPermissions',
  },
})

const formRules = {
  name: [{ required: true, message: t('key.nameRequired') }],
}

// 过期时间：编辑态去除「永久」选项，因为后端 Update 用 *time.Time + nil 判定，
// JSON null 与不传字段都无法清空已存在的过期时间，故编辑只能延长或自定义到未来。
const expireOptions = computed(() => {
  const finite = [
    { value: '7', label: t('key.expireDays', { n: 7 }) },
    { value: '30', label: t('key.expireDays', { n: 30 }) },
    { value: '90', label: t('key.expireDays', { n: 90 }) },
    { value: 'custom', label: t('key.expireCustom') },
  ]
  return isEdit.value ? finite : [{ value: 'never', label: t('key.expireNever') }, ...finite]
})

function onExpirePresetChange(v: string | number | boolean | Record<string, unknown> | undefined) {
  if (v === 'never' || v === '' || v === undefined) {
    formData.expires_at = null
    return
  }
  if (v === 'custom') {
    formData.expires_at = dayjs().add(30, 'day').format('YYYY-MM-DD HH:mm:ss')
  } else {
    formData.expires_at = dayjs().add(Number(v), 'day').format('YYYY-MM-DD HH:mm:ss')
  }
  reactivateIfExpired()
}

// 自定义日期变更（用户选了未来时间）同样触发重新启用
function onExpireDateChange() {
  reactivateIfExpired()
}

// 编辑过期密钥（status=2）时，一旦设定未来过期时间，把状态从「已过期」恢复为启用(1)。
function reactivateIfExpired() {
  if (isEdit.value && formData.status === 2) {
    formData.status = 1
  }
}

function openCreate() {
  handleCreate()
  expirePreset.value = 'never'
}

function openEdit(record: APIKey) {
  handleEdit(record)
  if (!record.expires_at) {
    // 永久密钥：编辑态无「永久」可选项，留空待用户主动选择是否设置过期时间
    expirePreset.value = ''
  } else {
    const diff = dayjs(record.expires_at).diff(dayjs(), 'day')
    if ([7, 30, 90].includes(diff)) {
      expirePreset.value = String(diff)
      formData.expires_at = dayjs().add(diff, 'day').format('YYYY-MM-DD HH:mm:ss')
    } else {
      expirePreset.value = 'custom'
      formData.expires_at = dayjs(record.expires_at).format('YYYY-MM-DD HH:mm:ss')
    }
  }
}

function isExpired(record: APIKey) {
  return !!record.expires_at && dayjs(record.expires_at).isBefore(dayjs())
}

function daysLeft(record: APIKey) {
  if (!record.expires_at) return Infinity
  return dayjs(record.expires_at).diff(dayjs(), 'day')
}

async function handleRegenerate(record: APIKey) {
  try {
    const res = await keyApi.regenerate(record.id)
    createdKey.value = res.data.key
    keyModalVisible.value = true
    await fetchData()
  } catch {
    Message.error(t('key.regenerateFail'))
  }
}

async function copyAndClose() {
  try {
    await copyToClipboard(createdKey.value)
    Message.success(t('key.keyCopied'))
    closeKeyModal()
  } catch {
    copyFailed.value = true
    Message.error(t('key.copyFailManual'))
  }
}

function confirmCopied() {
  closeKeyModal()
}

function closeKeyModal() {
  keyModalVisible.value = false
  createdKey.value = ''
  copyFailed.value = false
}

function budgetPeriodLabel(period: string) {
  const map: Record<string, string> = {
    daily: t('key.periodDay'),
    weekly: t('key.periodWeek'),
    monthly: t('key.periodMonth'),
  }
  return map[period] || period
}

function callPeriodLabel(period: string) {
  const map: Record<string, string> = {
    daily: t('key.periodDay'),
    weekly: t('key.periodWeek'),
    monthly: t('key.periodMonth'),
  }
  return map[period] || period
}

async function fetchModels() {
  try {
    const res = await modelApi.list()
    modelOptions.value = [...new Set(res.data.map((m) => m.model_name))].sort()
  } catch {
    // silently fail — model dropdown will just be empty
  }
}

onMounted(() => {
  fetchData()
  fetchModels()
})
</script>

<style scoped lang="less">
.key-page {
  :deep(.arco-table) {
    font-size: 13px;
  }

  .expire-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    // 默认下拉独占整行；进入自定义态时收窄，把空间让给日期选择器
    &__preset {
      flex: 1 1 auto;
    }

    &__preset--narrow {
      flex: 0 0 132px;
    }

    &__picker {
      flex: 1 1 auto;
      width: 100%;
    }
  }
}
</style>

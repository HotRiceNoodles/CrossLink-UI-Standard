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
            <a-button type="primary" @click="handleCreate">
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
            :width="80"
            align="center"
          >
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? t('common.enabled') : t('common.disabled') }}
              </a-tag>
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
                <a-button type="text" size="small" @click="handleEdit(record)">
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
          <a-input v-model="formData.name" :placeholder="t('key.namePlaceholder')" />
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
      <div style="margin-top: 16px; text-align: right">
        <a-button type="primary" @click="copyAndClose">{{ t('key.copyAndClose') }}</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { keyApi } from '@/api/key'
import { modelApi } from '@/api/model'
import { useCrud } from '@/composables/use-crud'
import { formatTime } from '@/utils/format'
import { getCurrencySymbol } from '@/utils/currency'
import type { APIKey } from '@/types'

const { t } = useI18n()

// Auxiliary data
const modelOptions = ref<string[]>([])

// Key reveal modal (unique to this view)
const keyModalVisible = ref(false)
const createdKey = ref('')

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
})

const formRules = {
  name: [{ required: true, message: t('key.nameRequired') }],
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
    await navigator.clipboard.writeText(createdKey.value)
    Message.success(t('key.keyCopied'))
  } catch {
    Message.error(t('key.copyFailManual'))
  }
  keyModalVisible.value = false
  createdKey.value = ''
}

function budgetPeriodLabel(period: string) {
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
}
</style>

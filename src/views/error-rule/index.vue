<template>
  <div class="error-rule-page">
    <a-card class="general-card">
      <template #title>{{ t('errorRule.title') }}</template>

      <!-- Search / Filter -->
      <a-row :gutter="16" align="center">
        <a-col :span="6">
          <a-select
            v-model="filter.match_field"
            :placeholder="t('errorRule.filterMatchField')"
            allow-clear
            style="width: 100%"
          >
            <a-option
              v-for="f in MATCH_FIELDS"
              :key="f"
              :value="f"
              :label="t(`errorRule.matchField.${f}`)"
            />
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-select
            v-model="filter.scope"
            :placeholder="t('errorRule.filterScope')"
            allow-clear
            style="width: 100%"
          >
            <a-option value="account" :label="t('errorRule.scope.account')" />
            <a-option value="model" :label="t('errorRule.scope.model')" />
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-input
            v-model="filter.keyword"
            :placeholder="t('errorRule.searchPattern')"
            allow-clear
          />
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
            {{ t('errorRule.totalRules', [filteredList.length]) }}
          </span>
        </a-col>
        <a-col>
          <a-space>
            <a-button
              v-if="userStore.hasPermission('error_rule:create')"
              type="primary"
              @click="handleCreate"
            >
              <template #icon><icon-plus /></template>
              {{ t('errorRule.createRule') }}
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
          <a-table-column :title="t('errorRule.colMatchField')" :width="120">
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ t(`errorRule.matchField.${record.match_field}`) }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column
            :title="t('errorRule.colPattern')"
            data-index="pattern"
            :ellipsis="true"
            :tooltip="true"
          />

          <a-table-column :title="t('errorRule.colClassification')" :width="120" align="center">
            <template #cell="{ record }">
              <a-tag color="purple">{{ record.classification }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column :title="t('errorRule.colProviderType')" :width="140">
            <template #cell="{ record }">
              <span v-if="!record.provider_type">
                <a-tag color="green">{{ t('errorRule.global') }}</a-tag>
              </span>
              <span v-else>{{ providerTypeLabel(record.provider_type) }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('errorRule.colScope')" :width="100" align="center">
            <template #cell="{ record }">
              {{ t(`errorRule.scope.${record.scope}`) }}
            </template>
          </a-table-column>

          <a-table-column
            :title="t('errorRule.colPriority')"
            data-index="priority"
            :width="90"
            align="right"
          />

          <a-table-column :title="t('common.status')" :width="90" align="center">
            <template #cell="{ record }">
              <a-switch
                :model-value="record.enabled"
                :disabled="!userStore.hasPermission('error_rule:update')"
                @change="(v: string | number | boolean) => toggleEnabled(record, !!v)"
              />
            </template>
          </a-table-column>

          <a-table-column :title="t('common.actions')" :width="160" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button
                  v-if="userStore.hasPermission('error_rule:update')"
                  type="text"
                  size="small"
                  @click="handleEdit(record)"
                >
                  {{ t('common.edit') }}
                </a-button>
                <a-popconfirm
                  v-if="userStore.hasPermission('error_rule:delete')"
                  :content="t('errorRule.deleteConfirm')"
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
      :width="520"
      :title="isEdit ? t('errorRule.editRule') : t('errorRule.createRule')"
      :mask-closable="false"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="match_field" :label="t('errorRule.formMatchField')">
          <a-select v-model="formData.match_field">
            <a-option
              v-for="f in MATCH_FIELDS"
              :key="f"
              :value="f"
              :label="t(`errorRule.matchField.${f}`)"
            />
          </a-select>
        </a-form-item>

        <a-form-item field="pattern" :label="t('errorRule.formPattern')">
          <a-input v-model="formData.pattern" :placeholder="patternPlaceholder" />
        </a-form-item>

        <a-form-item field="classification" :label="t('errorRule.formClassification')">
          <a-select v-model="formData.classification">
            <a-option value="quota" label="quota" />
          </a-select>
        </a-form-item>

        <a-form-item field="provider_type" :label="t('errorRule.formProviderType')">
          <a-select
            v-model="formData.provider_type"
            :placeholder="t('errorRule.formProviderTypePlaceholder')"
            allow-clear
          >
            <a-option
              v-for="a in adapterOptions"
              :key="a.type"
              :value="a.type"
              :label="a.display_name ? `${a.display_name} (${a.type})` : a.type"
            />
          </a-select>
          <template #extra>
            <span style="color: var(--color-text-3)">
              {{ t('errorRule.formProviderTypeHint') }}
            </span>
          </template>
        </a-form-item>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="scope" :label="t('errorRule.formScope')">
              <a-radio-group v-model="formData.scope">
                <a-radio value="account">{{ t('errorRule.scope.account') }}</a-radio>
                <a-radio value="model">{{ t('errorRule.scope.model') }}</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="priority" :label="t('errorRule.formPriority')">
              <a-input-number v-model="formData.priority" :min="0" style="width: 100%" />
              <template #extra>
                <span style="color: var(--color-text-3)">
                  {{ t('errorRule.formPriorityHint') }}
                </span>
              </template>
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-form-item field="enabled" :label="t('common.status')">
          <a-switch v-model="formData.enabled" />
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { errorRuleApi } from '@/api/error-rule'
import { providerApi } from '@/api/provider'
import { useCrud } from '@/composables/use-crud'
import { useUserStore } from '@/store'
import type { ErrorRule, Adapter } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()

const MATCH_FIELDS = ['status', 'code', 'type', 'message'] as const

const adapterOptions = ref<Adapter[]>([])

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
} = useCrud<ErrorRule, { match_field?: string; scope?: string; keyword: string }>({
  fetchApi: errorRuleApi.list,
  createApi: errorRuleApi.create,
  updateApi: errorRuleApi.update,
  deleteApi: errorRuleApi.delete,
  idField: 'id',
  fetchErrorMsg: t('errorRule.fetchFail'),
  deleteErrorMsg: t('common.deleteFail'),
  deleteSuccessMsg: t('errorRule.deleteSuccess'),
  updateSuccessMsg: t('errorRule.updateSuccess'),
  createSuccessMsg: t('errorRule.createSuccess'),
  defaultForm: () => ({
    match_field: 'message',
    pattern: '',
    classification: 'quota',
    provider_type: null,
    scope: 'account',
    priority: 100,
    enabled: true,
  }),
  filterFn: (item, f) => {
    let pass = true
    if (f.match_field) pass = pass && item.match_field === f.match_field
    if (f.scope) pass = pass && item.scope === f.scope
    if (f.keyword) {
      const kw = (f.keyword as string).toLowerCase()
      pass = pass && (item.pattern as string).toLowerCase().includes(kw)
    }
    return pass
  },
})

const formRules = {
  match_field: [{ required: true, message: t('errorRule.formMatchFieldRequired') }],
  pattern: [{ required: true, message: t('errorRule.formPatternRequired') }],
}

// pattern 输入提示随匹配字段变化：message 为子串匹配，其余为精确匹配
const patternPlaceholder = computed(() => {
  const field = (formData.match_field ?? 'message') as string
  return field === 'message'
    ? t('errorRule.patternPlaceholderMessage')
    : t('errorRule.patternPlaceholderExact')
})

function providerTypeLabel(type: string): string {
  const a = adapterOptions.value.find((x) => x.type === type)
  return a?.display_name ? `${a.display_name} (${type})` : type
}

// 行内启停开关：仅提交 enabled 字段，避免覆盖其余配置
async function toggleEnabled(record: ErrorRule, enabled: boolean) {
  try {
    await errorRuleApi.update(record.id, { enabled })
    record.enabled = enabled
    Message.success(t('common.updateSuccess'))
  } catch {
    Message.error(t('common.operationFail'))
  }
}

async function fetchAdapters() {
  try {
    const res = await providerApi.adapters()
    adapterOptions.value = res.data
  } catch {
    // 静默失败：provider_type 下拉为空仍可用（可手动清空表示全局）
  }
}

onMounted(() => {
  fetchData()
  fetchAdapters()
})
</script>

<style scoped lang="less">
.error-rule-page {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
</style>

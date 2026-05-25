<template>
  <div class="key-page">
    <a-card class="general-card">
      <template #title>API 密钥</template>

      <!-- Search / Filter -->
      <a-row :gutter="16" align="center">
        <a-col :span="6">
          <a-select
            v-model="filter.status"
            placeholder="状态"
            allow-clear
            style="width: 100%"
          >
            <a-option :value="1" label="启用" />
            <a-option :value="0" label="禁用" />
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-input
            v-model="filter.keyword"
            placeholder="搜索密钥名称"
            allow-clear
          />
        </a-col>
        <a-col :span="6">
          <a-space>
            <a-button type="primary" @click="applyFilter">查询</a-button>
            <a-button @click="resetFilter">重置</a-button>
          </a-space>
        </a-col>
      </a-row>

      <a-divider style="margin: 16px 0" />

      <!-- Toolbar -->
      <a-row justify="space-between" align="center" style="margin-bottom: 16px">
        <a-col>
          <span style="color: var(--color-text-3); font-size: 13px">
            共 {{ filteredList.length }} 个密钥
          </span>
        </a-col>
        <a-col>
          <a-space>
            <a-button type="primary" @click="handleCreate">
              <template #icon><icon-plus /></template>
              创建密钥
            </a-button>
            <a-tooltip content="刷新">
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
          <a-table-column title="名称" data-index="name" :width="160">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.name }}</span>
            </template>
          </a-table-column>

          <a-table-column title="密钥前缀" data-index="key_prefix" :width="120" align="center">
            <template #cell="{ record }">
              <a-tag color="arcoblue" style="font-family: monospace">{{ record.key_prefix }}...</a-tag>
            </template>
          </a-table-column>

          <a-table-column title="状态" data-index="status" :width="80" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column title="允许模型" :width="200" :ellipsis="true" :tooltip="true">
            <template #cell="{ record }">
              <template v-if="record.allowed_models?.length">
                {{ record.allowed_models.join(', ') }}
              </template>
              <span v-else style="color: var(--color-text-3)">全部</span>
            </template>
          </a-table-column>

          <a-table-column title="TPM" data-index="tpm_limit" :width="80" align="right">
            <template #cell="{ record }">
              {{ record.tpm_limit || '不限' }}
            </template>
          </a-table-column>

          <a-table-column title="RPM" data-index="rpm_limit" :width="80" align="right">
            <template #cell="{ record }">
              {{ record.rpm_limit || '不限' }}
            </template>
          </a-table-column>

          <a-table-column title="预算" :width="120" align="right">
            <template #cell="{ record }">
              <template v-if="record.max_budget">
                ¥{{ record.max_budget }} / {{ budgetPeriodLabel(record.budget_period) }}
              </template>
              <span v-else style="color: var(--color-text-3)">-</span>
            </template>
          </a-table-column>

          <a-table-column title="创建时间" data-index="created_at" :width="150">
            <template #cell="{ record }">
              {{ formatTime(record.created_at) }}
            </template>
          </a-table-column>

          <a-table-column title="最后使用" data-index="last_used_at" :width="150">
            <template #cell="{ record }">
              <template v-if="record.last_used_at">
                {{ dayjs(record.last_used_at).format('YYYY-MM-DD') }}
              </template>
              <span v-else style="color: var(--color-text-4); font-style: italic">从未使用</span>
            </template>
          </a-table-column>

          <a-table-column title="操作" :width="140" fixed="right">
            <template #cell="{ record }">
              <a-space :size="4">
                <a-button type="text" size="small" @click="handleEdit(record)">编辑</a-button>
                <a-popconfirm
                  content="重新生成将使旧密钥立即失效，确定继续？"
                  type="warning"
                  @ok="handleRegenerate(record)"
                >
                  <a-button type="text" size="small" style="color: rgb(var(--warning-6))">重新生成</a-button>
                </a-popconfirm>
                <a-popconfirm
                  content="确定要删除此密钥吗？"
                  type="warning"
                  @ok="handleDelete(record)"
                >
                  <a-button type="text" size="small" status="danger">删除</a-button>
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
      :title="isEdit ? '编辑密钥' : '创建密钥'"
      :mask-closable="false"
      unmount-on-close
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
      :ok-loading="submitLoading"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item field="name" label="名称">
          <a-input v-model="formData.name" placeholder="密钥名称" />
        </a-form-item>

        <a-form-item field="allowed_models" label="允许模型">
          <a-select
            v-model="formData.allowed_models"
            placeholder="输入模型名称后回车，留空表示全部"
            multiple
            allow-create
            allow-clear
          />
        </a-form-item>

        <a-form-item field="allowed_routes" label="允许路由">
          <a-select
            v-model="formData.allowed_routes"
            placeholder="选择允许的路由"
            multiple
            allow-clear
          >
            <a-option value="openai" label="OpenAI" />
            <a-option value="anthropic" label="Anthropic" />
          </a-select>
        </a-form-item>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="tpm_limit" label="TPM 限制">
              <a-input-number
                v-model="formData.tpm_limit"
                :min="0"
                placeholder="0 = 不限"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="rpm_limit" label="RPM 限制">
              <a-input-number
                v-model="formData.rpm_limit"
                :min="0"
                placeholder="0 = 不限"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="max_budget" label="预算上限">
              <a-input-number
                v-model="formData.max_budget"
                :min="0"
                :precision="2"
                placeholder="0 = 不限"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="budget_period" label="预算周期">
              <a-select v-model="formData.budget_period" placeholder="选择周期">
                <a-option value="daily" label="每日" />
                <a-option value="weekly" label="每周" />
                <a-option value="monthly" label="每月" />
              </a-select>
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-form-item v-if="isEdit" field="status" label="状态">
          <a-select v-model="formData.status">
            <a-option :value="1" label="启用" />
            <a-option :value="0" label="禁用" />
          </a-select>
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- Key Created Modal -->
    <a-modal
      v-model:visible="keyModalVisible"
      title="密钥创建成功"
      :mask-closable="false"
      :closable="false"
      :footer="false"
      :width="520"
    >
      <a-alert type="warning" :closable="false" style="margin-bottom: 16px">
        请立即保存此密钥，关闭后将无法再次查看完整密钥。
      </a-alert>
      <a-input
        :model-value="createdKey"
        readonly
        style="font-family: monospace"
      />
      <div style="margin-top: 16px; text-align: right">
        <a-button type="primary" @click="copyAndClose">复制并关闭</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { keyApi } from '@/api/key'
import { useLoading } from '@/hooks/loading'
import { useVisible } from '@/hooks/visible'
import type { APIKey, KeyCreateRequest } from '@/types'

const { loading, setLoading } = useLoading()
const { visible: drawerVisible, show: showDrawer, hide: hideDrawer } = useVisible()

const keyList = ref<APIKey[]>([])
const isEdit = ref(false)
const editingId = ref<number>()
const submitLoading = ref(false)
const formRef = ref()

// Key modal
const keyModalVisible = ref(false)
const createdKey = ref('')

// Filter
const filter = reactive({
  status: undefined as number | undefined,
  keyword: '',
})
const appliedFilter = reactive({
  status: undefined as number | undefined,
  keyword: '',
})

const filteredList = computed(() => {
  let list = keyList.value
  if (appliedFilter.status !== undefined && appliedFilter.status !== null) {
    list = list.filter((k) => k.status === appliedFilter.status)
  }
  if (appliedFilter.keyword) {
    const kw = appliedFilter.keyword.toLowerCase()
    list = list.filter((k) => k.name.toLowerCase().includes(kw))
  }
  return list
})

// Pagination
const pagination = reactive({
  current: 1,
  pageSize: 20,
  showTotal: true,
  showPageSize: true,
})

function onPageChange(page: number) {
  pagination.current = page
}

function onPageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.current = 1
}

// Form
const formData = reactive<KeyCreateRequest & { status?: number }>({
  name: '',
  allowed_models: [],
  allowed_routes: [],
  tpm_limit: 0,
  rpm_limit: 0,
  max_budget: null,
  budget_period: 'monthly',
  status: 1,
})

const formRules = {
  name: [{ required: true, message: '请输入密钥名称' }],
}

function resetForm() {
  formData.name = ''
  formData.allowed_models = []
  formData.allowed_routes = []
  formData.tpm_limit = 0
  formData.rpm_limit = 0
  formData.max_budget = null
  formData.budget_period = 'monthly'
  formData.status = 1
}

// Fetch
async function fetchData() {
  setLoading(true)
  try {
    const res = await keyApi.list()
    keyList.value = res.data
  } catch {
    Message.error('获取密钥列表失败')
  } finally {
    setLoading(false)
  }
}

// Filter actions
function applyFilter() {
  appliedFilter.status = filter.status
  appliedFilter.keyword = filter.keyword
  pagination.current = 1
}

function resetFilter() {
  filter.status = undefined
  filter.keyword = ''
  appliedFilter.status = undefined
  appliedFilter.keyword = ''
  pagination.current = 1
}

// CRUD
function handleCreate() {
  isEdit.value = false
  editingId.value = undefined
  resetForm()
  showDrawer()
}

function handleEdit(record: APIKey) {
  isEdit.value = true
  editingId.value = record.id
  formData.name = record.name
  formData.allowed_models = [...(record.allowed_models || [])]
  formData.allowed_routes = [...(record.allowed_routes || [])]
  formData.tpm_limit = record.tpm_limit
  formData.rpm_limit = record.rpm_limit
  formData.max_budget = record.max_budget
  formData.budget_period = record.budget_period
  formData.status = record.status
  showDrawer()
}

function handleDrawerClose() {
  hideDrawer()
  formRef.value?.resetFields()
}

async function handleDrawerSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    if (isEdit.value && editingId.value) {
      await keyApi.update(editingId.value, {
        ...formData,
      })
      Message.success('密钥更新成功')
    } else {
      const res = await keyApi.create({
        name: formData.name,
        allowed_models: formData.allowed_models,
        allowed_routes: formData.allowed_routes,
        tpm_limit: formData.tpm_limit,
        rpm_limit: formData.rpm_limit,
        max_budget: formData.max_budget,
        budget_period: formData.budget_period,
      })
      hideDrawer()
      createdKey.value = res.data.key
      keyModalVisible.value = true
      await fetchData()
      return
    }
    hideDrawer()
    await fetchData()
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    Message.error(error.response?.data?.error || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(record: APIKey) {
  try {
    await keyApi.delete(record.id)
    Message.success('密钥已删除')
    await fetchData()
  } catch {
    Message.error('删除失败')
  }
}

async function handleRegenerate(record: APIKey) {
  try {
    const res = await keyApi.regenerate(record.id)
    createdKey.value = res.data.key
    keyModalVisible.value = true
    await fetchData()
  } catch {
    Message.error('重新生成失败')
  }
}

async function copyAndClose() {
  try {
    await navigator.clipboard.writeText(createdKey.value)
    Message.success('密钥已复制到剪贴板')
  } catch {
    Message.error('复制失败，请手动复制')
  }
  keyModalVisible.value = false
  createdKey.value = ''
}

// Helpers
function formatTime(time: string) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function budgetPeriodLabel(period: string) {
  const map: Record<string, string> = { daily: '日', weekly: '周', monthly: '月' }
  return map[period] || period
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.key-page {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
</style>

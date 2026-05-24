<template>
  <div class="model-page">
    <a-card class="general-card">
      <template #title>模型管理</template>

      <!-- Search / Filter -->
      <a-row :gutter="16" class="search-bar" align="center">
        <a-col :span="6">
          <a-select
            v-model="searchForm.provider_id"
            placeholder="选择供应商"
            allow-clear
            style="width: 100%"
          >
            <a-option
              v-for="p in providerList"
              :key="p.id"
              :value="p.id"
              :label="p.display_name"
            />
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-select
            v-model="searchForm.routing_strategy"
            placeholder="路由策略"
            allow-clear
            style="width: 100%"
          >
            <a-option
              v-for="s in strategyOptions"
              :key="s.value"
              :value="s.value"
              :label="s.label"
            />
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model="searchForm.status"
            placeholder="状态"
            allow-clear
            style="width: 100%"
          >
            <a-option :value="1" label="启用" />
            <a-option :value="0" label="禁用" />
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-input
            v-model="searchForm.model_name"
            placeholder="搜索模型名称"
            allow-clear
            @clear="handleSearch"
            @press-enter="handleSearch"
          />
        </a-col>
        <a-col :span="3">
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-col>
      </a-row>

      <!-- Toolbar -->
      <a-row class="toolbar" justify="space-between" align="center">
        <a-col>
          <a-space>
            <span class="table-count">共 {{ filteredList.length }} 条记录</span>
          </a-space>
        </a-col>
        <a-col>
          <a-button type="primary" @click="handleCreate">
            <template #icon><icon-plus /></template>
            新建模型
          </a-button>
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
          <a-table-column title="模型名称" data-index="model_name" :width="160">
            <template #cell="{ record }">
              <a-tooltip :content="record.model_name">
                <span class="model-name">{{ record.model_name }}</span>
              </a-tooltip>
            </template>
          </a-table-column>

          <a-table-column title="供应商" :width="120">
            <template #cell="{ record }">
              {{ record.provider?.display_name ?? '-' }}
            </template>
          </a-table-column>

          <a-table-column title="供应商模型" data-index="provider_model" :width="160">
            <template #cell="{ record }">
              <span class="provider-model">{{ record.provider_model }}</span>
            </template>
          </a-table-column>

          <a-table-column title="权重" data-index="weight" :width="70" align="center" />

          <a-table-column title="优先级" data-index="priority" :width="70" align="center" />

          <a-table-column title="输入价格" :width="100" align="right">
            <template #cell="{ record }">
              {{ formatPrice(record.input_price, record.currency) }}
            </template>
          </a-table-column>

          <a-table-column title="输出价格" :width="100" align="right">
            <template #cell="{ record }">
              {{ formatPrice(record.output_price, record.currency) }}
            </template>
          </a-table-column>

          <a-table-column title="路由策略" data-index="routing_strategy" :width="110" align="center">
            <template #cell="{ record }">
              <a-tag :color="getStrategyColor(record.routing_strategy)">
                {{ getStrategyLabel(record.routing_strategy) }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column title="状态" data-index="status" :width="80" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>

          <a-table-column title="操作" :width="100" :fixed="'right'">
            <template #cell="{ record }">
              <a-dropdown @select="(val: string) => handleAction(val, record)">
                <a-button type="text" size="small">
                  <template #icon><icon-more /></template>
                </a-button>
                <template #content>
                  <a-doption value="edit">
                    <icon-edit /> 编辑
                  </a-doption>
                  <a-doption value="delete" class="danger-option">
                    <icon-delete /> 删除
                  </a-doption>
                </template>
              </a-dropdown>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- Drawer Form -->
    <a-drawer
      :visible="drawerVisible"
      :width="600"
      :title="isEdit ? '编辑模型' : '新建模型'"
      :mask-closable="false"
      unmount-on-close
      @cancel="handleDrawerClose"
      @ok="handleDrawerOk"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item field="provider_id" label="供应商" :rules="[{ required: true, message: '请选择供应商' }]">
          <a-select
            v-model="formData.provider_id"
            placeholder="请选择供应商"
            :disabled="isEdit"
          >
            <a-option
              v-for="p in providerList"
              :key="p.id"
              :value="p.id"
              :label="p.display_name"
            />
          </a-select>
        </a-form-item>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="model_name" label="模型名称" :rules="[{ required: true, message: '请输入模型名称' }]">
              <a-input v-model="formData.model_name" placeholder="请输入模型名称" />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="provider_model" label="供应商模型" :rules="[{ required: true, message: '请输入供应商模型' }]">
              <a-input v-model="formData.provider_model" placeholder="请输入供应商模型" />
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="weight" label="权重">
              <a-input-number
                v-model="formData.weight"
                :min="1"
                :max="100"
                :default-value="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="priority" label="优先级">
              <a-input-number
                v-model="formData.priority"
                :min="1"
                :max="100"
                :default-value="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-form-item field="max_context" label="最大上下文">
          <a-input-number
            v-model="formData.max_context"
            :min="0"
            placeholder="请输入最大上下文长度"
            style="width: 100%"
          />
        </a-form-item>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="input_price" label="输入价格">
              <a-input-number
                v-model="formData.input_price"
                :min="0"
                :precision="6"
                :step="0.000001"
                placeholder="0.000000"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="output_price" label="输出价格">
              <a-input-number
                v-model="formData.output_price"
                :min="0"
                :precision="6"
                :step="0.000001"
                placeholder="0.000000"
                style="width: 100%"
              />
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-grid :cols="24" :col-gap="16">
          <a-grid-item :span="12">
            <a-form-item field="currency" label="币种">
              <a-select v-model="formData.currency" placeholder="请选择币种">
                <a-option value="CNY" label="CNY" />
                <a-option value="USD" label="USD" />
              </a-select>
            </a-form-item>
          </a-grid-item>
          <a-grid-item :span="12">
            <a-form-item field="routing_strategy" label="路由策略">
              <a-select v-model="formData.routing_strategy" placeholder="请选择路由策略">
                <a-option
                  v-for="s in strategyOptions"
                  :key="s.value"
                  :value="s.value"
                  :label="s.label"
                />
              </a-select>
            </a-form-item>
          </a-grid-item>
        </a-grid>

        <a-form-item v-if="isEdit" field="status" label="状态">
          <a-select v-model="formData.status" placeholder="请选择状态">
            <a-option :value="1" label="启用" />
            <a-option :value="0" label="禁用" />
          </a-select>
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { modelApi } from '@/api/model'
import { providerApi } from '@/api/provider'
import { useLoading } from '@/hooks/loading'
import { useVisible } from '@/hooks/visible'
import type { ProviderModel, Provider, ModelCreateRequest } from '@/types'

// --- Hooks ---
const { loading, setLoading } = useLoading(false)
const { visible: drawerVisible, show: showDrawer, hide: hideDrawer } = useVisible(false)

// --- Data ---
const modelList = ref<ProviderModel[]>([])
const providerList = ref<Provider[]>([])
const formRef = ref()
const isEdit = ref(false)
const editingId = ref<number | null>(null)

// --- Search ---
const searchForm = reactive({
  provider_id: undefined as number | undefined,
  routing_strategy: undefined as string | undefined,
  status: undefined as number | undefined,
  model_name: '',
})

// --- Pagination ---
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

// --- Strategy map ---
const strategyMap: Record<string, { label: string; color: string }> = {
  weighted_random: { label: '加权随机', color: '#165DFF' },
  round_robin: { label: '轮询', color: '#00B42A' },
  least_latency: { label: '最低延迟', color: '#0FC6C2' },
  least_cost: { label: '最低成本', color: '#FF7D00' },
  canary: { label: '金丝雀', color: '#722ED1' },
  least_busy: { label: '最空闲', color: '#F77234' },
}

const strategyOptions = Object.entries(strategyMap).map(([value, { label }]) => ({
  value,
  label,
}))

function getStrategyLabel(key: string): string {
  return strategyMap[key]?.label ?? key
}

function getStrategyColor(key: string): string {
  return strategyMap[key]?.color ?? '#86909C'
}

// --- Price formatting ---
function formatPrice(price: number | null | undefined, currency: string | undefined): string {
  if (price === null || price === undefined) return '-'
  const prefix = currency === 'CNY' ? '¥' : '$'
  return `${prefix}${price.toFixed(6)}`
}

// --- Filtered list ---
const filteredList = computed(() => {
  let list = [...modelList.value]

  if (searchForm.provider_id !== undefined && searchForm.provider_id !== null) {
    list = list.filter((m) => m.provider_id === searchForm.provider_id)
  }

  if (searchForm.routing_strategy) {
    list = list.filter((m) => m.routing_strategy === searchForm.routing_strategy)
  }

  if (searchForm.status !== undefined && searchForm.status !== null) {
    list = list.filter((m) => m.status === searchForm.status)
  }

  if (searchForm.model_name) {
    const keyword = searchForm.model_name.toLowerCase()
    list = list.filter((m) => m.model_name.toLowerCase().includes(keyword))
  }

  return list
})

// --- Form data ---
function createEmptyForm(): Partial<ModelCreateRequest> & { status?: number } {
  return {
    provider_id: undefined,
    model_name: '',
    provider_model: '',
    weight: 1,
    priority: 1,
    max_context: undefined,
    input_price: undefined,
    output_price: undefined,
    currency: 'CNY',
    routing_strategy: 'weighted_random',
    status: 1,
  }
}

const formData = reactive(createEmptyForm())

const formRules = {
  provider_id: [{ required: true, message: '请选择供应商' }],
  model_name: [{ required: true, message: '请输入模型名称' }],
  provider_model: [{ required: true, message: '请输入供应商模型' }],
}

// --- Fetch data ---
async function fetchModels() {
  setLoading(true)
  try {
    const res = await modelApi.list()
    modelList.value = res.data ?? []
  } catch {
    Message.error('获取模型列表失败')
  } finally {
    setLoading(false)
  }
}

async function fetchProviders() {
  try {
    const res = await providerApi.list()
    providerList.value = res.data ?? []
  } catch {
    Message.error('获取供应商列表失败')
  }
}

// --- Search ---
function handleSearch() {
  pagination.current = 1
}

function handleReset() {
  searchForm.provider_id = undefined
  searchForm.routing_strategy = undefined
  searchForm.status = undefined
  searchForm.model_name = ''
  pagination.current = 1
}

// --- Actions ---
function handleCreate() {
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, createEmptyForm())
  showDrawer()
}

function handleAction(action: string, record: ProviderModel) {
  if (action === 'edit') {
    handleEdit(record)
  } else if (action === 'delete') {
    handleDelete(record)
  }
}

function handleEdit(record: ProviderModel) {
  isEdit.value = true
  editingId.value = record.id
  Object.assign(formData, {
    provider_id: record.provider_id,
    model_name: record.model_name,
    provider_model: record.provider_model,
    weight: record.weight,
    priority: record.priority,
    max_context: record.max_context,
    input_price: record.input_price,
    output_price: record.output_price,
    currency: record.currency,
    routing_strategy: record.routing_strategy,
    status: record.status,
  })
  showDrawer()
}

async function handleDelete(record: ProviderModel) {
  const confirmed = await new Promise<boolean>((resolve) => {
    const { confirm } = window as unknown as { confirm: (msg: string) => boolean }
    // Arco doesn't expose Modal.confirm directly in a simple way, use a workaround
    resolve(confirm(`确定要删除模型「${record.model_name}」吗？`))
  })
  if (!confirmed) return

  try {
    await modelApi.delete(record.id)
    Message.success('删除成功')
    await fetchModels()
  } catch {
    Message.error('删除失败')
  }
}

// --- Drawer ---
function handleDrawerClose() {
  hideDrawer()
}

async function handleDrawerOk() {
  const errors = await formRef.value?.validate()
  if (errors) return

  try {
    const payload: Partial<ModelCreateRequest> = {
      provider_id: formData.provider_id,
      model_name: formData.model_name,
      provider_model: formData.provider_model,
      weight: formData.weight,
      priority: formData.priority,
      max_context: formData.max_context ?? null,
      input_price: formData.input_price ?? null,
      output_price: formData.output_price ?? null,
      currency: formData.currency,
      routing_strategy: formData.routing_strategy,
    }

    if (isEdit.value && editingId.value !== null) {
      await modelApi.update(editingId.value, {
        ...payload,
        status: formData.status,
      })
      Message.success('更新成功')
    } else {
      await modelApi.create(payload as ModelCreateRequest)
      Message.success('创建成功')
    }

    hideDrawer()
    await fetchModels()
  } catch {
    Message.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

// --- Init ---
onMounted(() => {
  fetchProviders()
  fetchModels()
})
</script>

<style scoped>
.model-page {
  padding: 0;
}

.search-bar {
  margin-bottom: 16px;
}

.toolbar {
  margin-bottom: 12px;
}

.table-count {
  color: var(--color-text-3);
  font-size: 13px;
}

.model-name {
  font-weight: 600;
}

.provider-model {
  font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
  color: var(--color-text-3);
  font-size: 13px;
}

:deep(.danger-option) {
  color: rgb(var(--danger-6)) !important;
}

:deep(.danger-option:hover) {
  background-color: var(--color-danger-light-1) !important;
}
</style>

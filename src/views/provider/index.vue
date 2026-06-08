<template>
  <div class="provider-page">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <h2>{{ t('provider.title') }}</h2>
      <a-space>
        <a-button type="primary" @click="openProviderCreate">
          <template #icon><icon-plus /></template>
          {{ t('provider.addProvider') }}
        </a-button>
        <a-tooltip :content="t('common.refresh')">
          <a-button @click="fetchData">
            <template #icon><icon-refresh /></template>
          </a-button>
        </a-tooltip>
      </a-space>
    </div>

    <!-- 筛选栏 -->
    <a-card class="general-card filter-card">
      <a-row :gutter="16" align="center">
        <a-col :span="6">
          <a-select
            v-model="filter.status"
            :placeholder="t('provider.providerStatus')"
            allow-clear
            style="width: 100%"
          >
            <a-option :value="1" :label="t('common.enabled')" />
            <a-option :value="0" :label="t('common.disabled')" />
          </a-select>
        </a-col>
        <a-col :span="10">
          <a-input
            v-model="searchInput"
            :placeholder="t('provider.modelSearch')"
            allow-clear
            @input="debouncedModelSearch"
            @clear="clearModelSearch"
          />
        </a-col>
        <a-col :span="4">
          <a-button @click="resetFilter">{{ t('common.reset') }}</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 卡片列表 -->
    <a-spin :loading="loading" style="width: 100%">
      <div class="card-list">
        <ProviderCard
          v-for="provider in displayedProviders"
          :key="provider.id"
          :provider="provider"
          :models="getModelsForProvider(provider.id)"
          :adapter="getAdapter(provider.adapter_type)"
          :testing-id="testingId"
          :probe-status="probeStatusMap[provider.id]"
          @test="handleTest"
          @edit-provider="openProviderEdit"
          @delete-provider="handleDeleteProvider"
          @add-model="openModelCreate"
          @edit-model="openModelEdit"
          @delete-model="handleDeleteModel"
        />
      </div>
      <!-- 无供应商时的引导空状态 -->
      <div
        v-if="!loading && filteredProviders.length === 0 && providerList.length === 0"
        class="empty-guide"
      >
        <a-empty>
          <template #description>
            <span>{{ t('provider.noProviders') }}</span>
            <p style="color: var(--color-text-4); font-size: 13px; margin-top: 4px">
              {{ t('provider.noProvidersGuide') }}
            </p>
          </template>
        </a-empty>
      </div>
      <!-- 有数据但筛选为空的常规空状态 -->
      <a-empty v-else-if="!loading && filteredProviders.length === 0 && providerList.length > 0" />
    </a-spin>

    <!-- 底部统计 -->
    <div v-if="filteredProviders.length > 0" class="list-footer">
      <span class="list-total">{{ t('provider.totalProviders', [filteredProviders.length]) }}</span>
      <a-pagination
        v-if="filteredProviders.length > PAGE_SIZE_THRESHOLD"
        v-model:current="pagination.current"
        :total="filteredProviders.length"
        :page-size="pagination.pageSize"
        show-total
        @change="onPageChange"
      />
    </div>

    <!-- 供应商抽屉 -->
    <ProviderForm
      :visible="providerFormVisible"
      :is-edit="providerFormIsEdit"
      :provider="providerFormEditTarget"
      :adapter-list="adapterList"
      @update:visible="providerFormVisible = $event"
      @success="fetchData"
    />

    <!-- 模型抽屉 -->
    <ModelForm
      :visible="modelFormVisible"
      :is-edit="modelFormIsEdit"
      :model="modelFormEditTarget"
      :provider-list="providerList"
      :default-provider-id="modelFormDefaultProviderId"
      @update:visible="modelFormVisible = $event"
      @success="onModelFormSuccess"
    />

    <!-- 连通性测试模型选择弹窗 -->
    <a-modal
      v-model:visible="testModalVisible"
      :title="t('provider.testSelectModel')"
      :ok-text="t('provider.probeConnectivity')"
      :ok-loading="testLoading"
      :mask-closable="!testLoading"
      :closable="!testLoading"
      @ok="executeTest"
      @cancel="testModalVisible = false"
    >
      <a-spin :loading="testLoading" style="width: 100%">
        <a-radio-group v-model="testSelectedModel" direction="vertical" style="width: 100%">
          <!-- 自动选择 -->
          <a-radio value="">
            <span>{{ t('provider.testModelAuto') }}</span>
            <span style="color: var(--color-text-3); font-size: 12px; margin-left: 8px">
              {{ t('provider.testModelAutoDesc') }}
            </span>
          </a-radio>
          <!-- 具体模型列表 -->
          <a-radio v-for="m in testTargetModels" :key="m.id" :value="m.provider_model">
            <span style="font-weight: 600">{{ m.model_name }}</span>
            <span style="color: var(--color-text-3); font-size: 12px; margin-left: 8px">
              {{ m.provider_model }}
            </span>
          </a-radio>
        </a-radio-group>

        <a-empty
          v-if="testTargetModels.length === 0"
          :description="t('provider.testNoModels')"
          :style="{ padding: '16px 0' }"
        />

        <!-- 测试结果 -->
        <a-alert
          v-if="testResult"
          :type="testResult.success ? 'success' : 'error'"
          style="margin-top: 16px"
        >
          <template v-if="testResult.success">
            {{ t('provider.testSuccess', [testResult.latency_ms ?? '-']) }}
          </template>
          <template v-else>
            {{ t('provider.testFail', [testResult.error || t('provider.connectFail')]) }}
          </template>
        </a-alert>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import { providerApi } from '@/api/provider'
import type { TestResult } from '@/api/provider'
import { modelApi } from '@/api/model'
import { useLoading } from '@/hooks/loading'
import type { Provider, ProviderModel, Adapter } from '@/types'
import ProviderCard from './components/provider-card.vue'
import ProviderForm from './components/provider-form.vue'
import ModelForm from './components/model-form.vue'

const { loading, setLoading } = useLoading(false)
const { t } = useI18n()

// ---------- Data ----------
const providerList = ref<Provider[]>([])
const modelList = ref<ProviderModel[]>([])
const adapterList = ref<Adapter[]>([])
const testingId = ref<number | null>(null)

// ---------- Test Modal ----------
const testModalVisible = ref(false)
const testTargetProvider = ref<Provider | null>(null)
const testSelectedModel = ref<string>('')
const testLoading = ref(false)
const testResult = ref<TestResult | null>(null)

// ---------- Filter ----------
const PAGE_SIZE_THRESHOLD = 50

const filter = reactive({
  status: undefined as number | undefined,
  modelName: '',
})

const searchInput = ref('')
const debouncedModelSearch = useDebounceFn((value: string) => {
  filter.modelName = value
  pagination.current = 1
}, 300)

function clearModelSearch() {
  filter.modelName = ''
  pagination.current = 1
}

function resetFilter() {
  filter.status = undefined
  searchInput.value = ''
  filter.modelName = ''
  pagination.current = 1
}

// ---------- Computed ----------
const modelsByProvider = computed(() => {
  const map = new Map<number, ProviderModel[]>()
  for (const model of modelList.value) {
    const list = map.get(model.provider_id) || []
    list.push(model)
    map.set(model.provider_id, list)
  }
  return map
})

const filteredProviders = computed(() => {
  let list = providerList.value
  if (filter.status !== undefined && filter.status !== null) {
    list = list.filter((p) => p.status === filter.status)
  }
  if (filter.modelName) {
    const kw = filter.modelName.toLowerCase()
    list = list.filter((p) => {
      const models = modelsByProvider.value.get(p.id) || []
      return models.some((m) => m.model_name.toLowerCase().includes(kw))
    })
  }
  return list
})

const pagination = reactive({ current: 1, pageSize: 20 })

const displayedProviders = computed(() => {
  if (filteredProviders.value.length <= PAGE_SIZE_THRESHOLD) {
    return filteredProviders.value
  }
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredProviders.value.slice(start, start + pagination.pageSize)
})

function onPageChange(page: number) {
  pagination.current = page
}

// ---------- Probe status ----------
const probeStatusMap = reactive<Record<number, 'success' | 'fail' | 'testing'>>({})

// ---------- Provider Form ----------
const providerFormVisible = ref(false)
const providerFormIsEdit = ref(false)
const providerFormEditTarget = ref<Provider | undefined>()

function openProviderCreate() {
  providerFormIsEdit.value = false
  providerFormEditTarget.value = undefined
  providerFormVisible.value = true
}

function openProviderEdit(provider: Provider) {
  providerFormIsEdit.value = true
  providerFormEditTarget.value = provider
  providerFormVisible.value = true
}

// ---------- Model Form ----------
const modelFormVisible = ref(false)
const modelFormIsEdit = ref(false)
const modelFormEditTarget = ref<ProviderModel | undefined>()
const modelFormDefaultProviderId = ref<number | undefined>()

function openModelCreate(provider: Provider) {
  modelFormIsEdit.value = false
  modelFormEditTarget.value = undefined
  modelFormDefaultProviderId.value = provider.id
  modelFormVisible.value = true
}

function openModelEdit(model: ProviderModel, _provider: Provider) {
  modelFormIsEdit.value = true
  modelFormEditTarget.value = model
  modelFormDefaultProviderId.value = undefined
  modelFormVisible.value = true
}

function onModelFormSuccess() {
  fetchModels()
}

// ---------- Actions ----------
function handleTest(provider: Provider) {
  testTargetProvider.value = provider
  testSelectedModel.value = ''
  testResult.value = null
  testModalVisible.value = true
}

async function executeTest() {
  const provider = testTargetProvider.value
  if (!provider) return

  testLoading.value = true
  testResult.value = null
  testingId.value = provider.id
  probeStatusMap[provider.id] = 'testing'

  try {
    const res = await providerApi.test(provider.id, testSelectedModel.value || undefined)
    testResult.value = res.data
    if (res.data.success) {
      probeStatusMap[provider.id] = 'success'
    } else {
      probeStatusMap[provider.id] = 'fail'
    }
  } catch {
    probeStatusMap[provider.id] = 'fail'
    testResult.value = { success: false, error: t('provider.connectTestFail') }
  } finally {
    testLoading.value = false
    testingId.value = null
  }
}

const testTargetModels = computed(() => {
  if (!testTargetProvider.value) return []
  return modelsByProvider.value.get(testTargetProvider.value.id) || []
})

function handleDeleteProvider(provider: Provider) {
  const models = modelsByProvider.value.get(provider.id) || []
  if (models.length > 0) {
    Modal.warning({
      title: t('provider.cannotDelete'),
      content: t('provider.cannotDeleteContent', [models.length]),
    })
    return
  }
  Modal.confirm({
    title: t('common.confirm'),
    content: t('provider.confirmDeleteProvider', [provider.display_name]),
    onOk: async () => {
      try {
        await providerApi.delete(provider.id)
        Message.success(t('common.deleteSuccess'))
        await fetchData()
      } catch {
        Message.error(t('common.deleteFail'))
      }
    },
  })
}

function handleDeleteModel(model: ProviderModel) {
  Modal.confirm({
    title: t('common.confirm'),
    content: t('provider.confirmDeleteModel', [model.model_name]),
    onOk: async () => {
      try {
        await modelApi.delete(model.id)
        Message.success(t('common.deleteSuccess'))
        await fetchModels()
      } catch {
        Message.error(t('common.deleteFail'))
      }
    },
  })
}

// ---------- Helpers ----------
function getModelsForProvider(providerId: number): ProviderModel[] {
  let models = modelsByProvider.value.get(providerId) || []
  if (filter.modelName) {
    const kw = filter.modelName.toLowerCase()
    models = models.filter((m) => m.model_name.toLowerCase().includes(kw))
  }
  return models
}

function getAdapter(type: string): Adapter | undefined {
  return adapterList.value.find((a) => a.type === type)
}

// ---------- Fetch ----------
async function fetchData() {
  setLoading(true)
  try {
    const [pRes, mRes, aRes] = await Promise.all([
      providerApi.list(),
      modelApi.list(),
      providerApi.adapters(),
    ])
    providerList.value = pRes.data ?? []
    modelList.value = mRes.data ?? []
    adapterList.value = aRes.data ?? []
  } catch {
    Message.error(t('provider.loadDataFail'))
  } finally {
    setLoading(false)
  }
}

async function fetchModels() {
  try {
    const res = await modelApi.list()
    modelList.value = res.data ?? []
  } catch {
    Message.error(t('provider.fetchModelListFail'))
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.provider-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
  }
}

.filter-card {
  :deep(.arco-card-body) {
    padding: 16px;
  }
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-guide {
  padding: 60px 0;
  text-align: center;
}

.list-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;

  .list-total {
    font-size: 13px;
    color: var(--color-text-3);
  }
}
</style>

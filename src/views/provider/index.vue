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

    <!-- 运行时熔断（进程内存态快照；仅活跃电路，closed 不返回） -->
    <a-card v-if="circuits.length" class="general-card circuit-card">
      <template #title>
        <a-space>
          <span>{{ t('provider.circuitTitle') }}</span>
          <a-badge :count="circuits.length" color="orangered" />
        </a-space>
      </template>
      <template #extra>
        <a-button size="small" @click="fetchCircuits">
          <template #icon><icon-refresh /></template>
          {{ t('common.refresh') }}
        </a-button>
      </template>
      <a-table :data="circuits" :pagination="false" :row-key="circuitRowKey" size="small">
        <template #columns>
          <a-table-column :title="t('model.providerLabel')" data-index="provider" :width="140">
            <template #cell="{ record }">
              <span class="mono">{{ record.provider }}</span>
            </template>
          </a-table-column>
          <a-table-column :title="t('provider.circuitModel')" :width="160">
            <template #cell="{ record }">
              <span v-if="record.model" class="mono">{{ record.model }}</span>
              <a-tag v-else color="gray" size="small">
                {{ t('provider.circuitAccountLevel') }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column :title="t('provider.circuitState')" :width="100" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.state === 'open' ? 'red' : 'orange'" size="small">
                {{
                  record.state === 'open'
                    ? t('provider.circuitOpen')
                    : t('provider.circuitHalfOpen')
                }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column :title="t('provider.circuitKind')" :width="100" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.kind === 'persistent' ? 'red' : 'blue'" size="small">
                {{
                  record.kind === 'persistent'
                    ? t('provider.circuitPersistent')
                    : t('provider.circuitTransient')
                }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column :title="t('provider.circuitRecover')" :width="130" align="right">
            <template #cell="{ record }">
              <span v-if="record.state === 'half_open'">{{ t('provider.circuitProbing') }}</span>
              <span v-else>{{ t('provider.circuitSeconds', [record.recover_in_seconds]) }}</span>
            </template>
          </a-table-column>
          <a-table-column
            :title="t('provider.circuitOpenCount')"
            data-index="open_count"
            :width="90"
            align="right"
          />
          <a-table-column :title="t('provider.circuitError')" :width="220" ellipsis tooltip>
            <template #cell="{ record }">
              <span v-if="record.error_type" class="mono">
                {{ record.error_type }}: {{ record.error_message }}
              </span>
              <span v-else>-</span>
            </template>
          </a-table-column>
          <a-table-column
            v-if="userStore.hasPermission('provider:update')"
            :title="t('common.actions')"
            :width="110"
            align="center"
          >
            <template #cell="{ record }">
              <a-popconfirm
                :content="t('provider.circuitResetConfirm')"
                type="warning"
                @ok="resetCircuit(record)"
              >
                <a-button type="text" size="small">{{ t('provider.circuitReset') }}</a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </template>
      </a-table>
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
          @remote-models="openRemoteModels"
          @edit-model="openModelEdit"
          @delete-model="handleDeleteModel"
        />
      </div>
      <!-- 无供应商时的引导空状态 -->
      <div
        v-if="!loading && filteredProviders.length === 0 && providerList.length === 0"
        class="empty-guide"
      >
        <EmptyState :desc="t('provider.noProviders')">
          <div class="empty-guide-text">
            <span>{{ t('provider.noProviders') }}</span>
            <p>{{ t('provider.noProvidersGuide') }}</p>
          </div>
          <template #action>
            <a-button type="primary" @click="reopenOnboarding">
              {{ t('onboarding.reopenFromEmpty') }}
            </a-button>
          </template>
        </EmptyState>
      </div>
      <!-- 有数据但筛选为空的常规空状态 -->
      <EmptyState
        v-else-if="!loading && filteredProviders.length === 0 && providerList.length > 0"
      />
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

    <!-- 远端模型目录导入：拉取上游列表，勾选后批量创建映射 -->
    <a-modal
      v-model:visible="remoteVisible"
      :title="
        t('provider.remoteTitle', [remoteProvider?.display_name || remoteProvider?.name || ''])
      "
      :width="560"
      :mask-closable="false"
      :ok-loading="importing"
      :ok-text="t('provider.remoteImport', [selectedRemoteIds.length])"
      :disabled-ok="!selectedRemoteIds.length"
      @ok="importRemoteModels"
      @cancel="remoteVisible = false"
    >
      <a-spin :loading="remoteLoading" style="width: 100%">
        <a-space direction="vertical" fill style="width: 100%">
          <a-alert v-if="remoteError" type="error">{{ remoteError }}</a-alert>
          <a-alert v-else-if="remoteResult && !remoteResult.models_supported" type="info">
            {{ t('provider.remoteUnsupported') }}
          </a-alert>
          <template v-if="remoteModels.length">
            <a-input
              v-model="remoteFilter"
              :placeholder="t('provider.remoteFilterPh')"
              allow-clear
            />
            <div class="remote-model-list">
              <a-checkbox-group v-model="selectedRemoteIds" direction="vertical">
                <a-checkbox v-for="m in filteredRemoteModels" :key="m.id" :value="m.id">
                  <span class="mono">{{ m.id }}</span>
                  <span v-if="m.owned_by" class="remote-owned">{{ m.owned_by }}</span>
                </a-checkbox>
              </a-checkbox-group>
            </div>
            <a-space>
              <a-link @click="selectAllRemote">{{ t('provider.remoteSelectAll') }}</a-link>
              <a-link @click="selectedRemoteIds = []">{{ t('provider.remoteSelectNone') }}</a-link>
              <span v-if="remoteResult?.latency_ms" class="remote-latency">
                {{ remoteResult.latency_ms }}ms
              </span>
            </a-space>
          </template>
        </a-space>
      </a-spin>
    </a-modal>

    <!-- 连通性测试模型选择弹窗。
         注意：点确定必须走 on-before-ok 并返回 false——@ok 触发后 v-model 会
         自动把弹窗关掉，结果面板就永远看不到了（这正是之前"探测无提示"的根因） -->
    <a-modal
      v-model:visible="testModalVisible"
      :title="t('provider.testSelectModel')"
      :ok-text="testResult ? t('provider.testAgain') : t('provider.probeConnectivity')"
      :on-before-ok="onTestBeforeOk"
      :mask-closable="!testLoading"
      :closable="!testLoading"
      @cancel="testModalVisible = false"
    >
      <a-spin :loading="testLoading" style="width: 100%">
        <!-- 测试结果：大图标结果面板，弹窗内直接反馈 -->
        <div v-if="testResult && !testLoading" class="test-result">
          <a-result :status="testResult.success ? 'success' : 'error'">
            <template #title>
              {{ testResult.success ? t('provider.connected') : t('provider.connectFail') }}
            </template>
            <template #subtitle>
              <template v-if="testResult.success">
                {{ t('provider.testSuccess', [testResult.latency_ms ?? '-']) }}
              </template>
              <template v-else>
                {{ testResult.error || t('provider.connectFail') }}
              </template>
            </template>
          </a-result>
          <div class="test-result-actions">
            <a-button @click="backToModelSelect">{{ t('provider.testChangeModel') }}</a-button>
          </div>
        </div>

        <!-- 模型选择 -->
        <template v-else>
          <a-radio-group v-model="testSelectedModel" direction="vertical" style="width: 100%">
            <!-- 自动选择 -->
            <a-radio value="">
              <span>{{ t('provider.testModelAuto') }}</span>
              <span style="color: var(--color-text-3); font-size: 12px; margin-inline-start: 8px">
                {{ t('provider.testModelAutoDesc') }}
              </span>
            </a-radio>
            <!-- 具体模型列表 -->
            <a-radio v-for="m in testTargetModels" :key="m.id" :value="m.provider_model">
              <span style="font-weight: 600">{{ m.model_name }}</span>
              <span style="color: var(--color-text-3); font-size: 12px; margin-inline-start: 8px">
                {{ m.provider_model }}
              </span>
            </a-radio>
          </a-radio-group>

          <EmptyState v-if="testTargetModels.length === 0" :desc="t('provider.testNoModels')" />
        </template>
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
import { useUserStore } from '@/store'
import type { TestResult } from '@/api/provider'
import { modelApi } from '@/api/model'
import { useLoading } from '@/hooks/loading'
import type {
  Provider,
  ProviderModel,
  Adapter,
  ProviderCircuit,
  RemoteModelItem,
  RemoteModelsResult,
} from '@/types'
import ProviderCard from './components/provider-card.vue'
import EmptyState from '@/components/empty-state.vue'
import ProviderForm from './components/provider-form.vue'
import ModelForm from './components/model-form.vue'
import { ONBOARDING_EVENT, useOnboardingGuard } from '@/composables/use-onboarding-wizard'

const { loading, setLoading } = useLoading(false)
const { t } = useI18n()
const { blocked: onboardingBlocked, runOnboarding: runOnboardingGuarded } = useOnboardingGuard()

// ---------- Data ----------
const providerList = ref<Provider[]>([])
const modelList = ref<ProviderModel[]>([])
const adapterList = ref<Adapter[]>([])
const testingId = ref<number | null>(null)

// ---------- Test Modal ----------
const testModalVisible = ref(false)
const testTargetProvider = ref<Provider | null>(null)
const testSelectedModel = ref<string>('')
const { loading: testLoading, setLoading: setTestLoading } = useLoading()
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

function reopenOnboarding() {
  // 企业版全局视角时弹提示，其余情况派发事件打开向导。
  if (onboardingBlocked.value) {
    runOnboardingGuarded() // 仅弹提示，不打开
    return
  }
  window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT))
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

  setTestLoading(true)
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
    setTestLoading(false)
    testingId.value = null
  }
}

/** 从结果面板返回模型选择（保留当前选择）。 */
function backToModelSelect() {
  testResult.value = null
}

/**
 * 确定按钮：执行探测但保持弹窗打开以展示结果面板。
 * on-before-ok 返回 false 阻止 Arco 默认的「点确定即关闭」。
 */
async function onTestBeforeOk(): Promise<boolean> {
  await executeTest()
  return false
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
    content: t('provider.confirmDeleteProvider', { name: provider.display_name }),
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
    content: t('provider.confirmDeleteModel', { name: model.model_name }),
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

// ---- 运行时熔断（/providers/health）----
const circuits = ref<ProviderCircuit[]>([])
const userStore = useUserStore()

// 同一供应商可同时存在账号级 + 多个模型级电路——用组合键避免 row-key 重复
function circuitRowKey(record: ProviderCircuit): string {
  return `${record.provider}/${record.model || '_account'}`
}

async function fetchCircuits() {
  try {
    const res = await providerApi.circuits()
    circuits.value = res.data.circuits ?? []
  } catch {
    // 熔断视图不可用（如 health tracker 未接线）不阻塞供应商页
    circuits.value = []
  }
}

async function resetCircuit(record: ProviderCircuit) {
  try {
    await providerApi.resetCircuit(record.provider, record.model)
    Message.success(t('common.updateSuccess'))
    await fetchCircuits()
  } catch {
    Message.error(t('common.operationFail'))
  }
}

// ---- 远端模型目录导入（/providers/:id/models/remote）----
const remoteVisible = ref(false)
const remoteLoading = ref(false)
const remoteError = ref('')
const remoteProvider = ref<Provider | null>(null)
const remoteResult = ref<RemoteModelsResult | null>(null)
const remoteModels = ref<RemoteModelItem[]>([])
const remoteFilter = ref('')
const selectedRemoteIds = ref<string[]>([])
const importing = ref(false)

const filteredRemoteModels = computed(() => {
  const kw = remoteFilter.value.trim().toLowerCase()
  if (!kw) return remoteModels.value
  return remoteModels.value.filter((m) => m.id.toLowerCase().includes(kw))
})

function openRemoteModels(provider: Provider) {
  remoteProvider.value = provider
  remoteVisible.value = true
  remoteError.value = ''
  remoteResult.value = null
  remoteModels.value = []
  remoteFilter.value = ''
  selectedRemoteIds.value = []
  loadRemoteModels()
}

async function loadRemoteModels() {
  if (!remoteProvider.value) return
  remoteLoading.value = true
  try {
    // 失败路径也返回 200 + success:false —— 按字段呈现
    const res = await providerApi.remoteModels(remoteProvider.value.id)
    remoteResult.value = res.data
    if (res.data.success && res.data.models) {
      remoteModels.value = res.data.models
      selectedRemoteIds.value = res.data.models.map((m) => m.id)
    } else if (res.data.error) {
      remoteError.value = res.data.error
    }
  } catch {
    remoteError.value = t('provider.remoteFetchFail')
  } finally {
    remoteLoading.value = false
  }
}

function selectAllRemote() {
  selectedRemoteIds.value = filteredRemoteModels.value.map((m) => m.id)
}

async function importRemoteModels() {
  if (!remoteProvider.value || !selectedRemoteIds.value.length) return
  importing.value = true
  let created = 0
  let failed = 0
  try {
    for (const id of selectedRemoteIds.value) {
      try {
        // 默认参数创建映射：weight=1 / priority=1 / 无定价，后续在模型表里精调
        await modelApi.create({
          provider_id: remoteProvider.value.id,
          model_name: id,
          provider_model: id,
        })
        created++
      } catch {
        failed++
      }
    }
    if (created) Message.success(t('provider.remoteImported', [created]))
    if (failed) Message.warning(t('provider.remoteImportFailed', [failed]))
    if (created) {
      remoteVisible.value = false
      await fetchData()
    }
  } finally {
    importing.value = false
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
  fetchCircuits()
})
</script>

<style scoped lang="less">
.circuit-card {
  margin-bottom: 16px;
}

.mono {
  font-family: var(--cl-font-mono);
  font-size: 12px;
}

.remote-model-list {
  max-height: 320px;
  overflow: auto;
  padding: 8px 12px;
  border: 1px solid var(--color-fill-2);
  border-radius: 4px;

  .remote-owned {
    margin-left: 8px;
    color: var(--color-text-3);
    font-size: 12px;
  }
}

.remote-latency {
  color: var(--color-text-3);
  font-size: 12px;
}

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
  padding: 40px 0;

  .empty-guide-text {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      font-size: 14px;
      color: var(--color-text-2);
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--color-text-4);
    }
  }
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

.test-result {
  .test-result-actions {
    display: flex;
    justify-content: center;
    margin-top: 4px;
  }

  // a-result 默认上下留白偏大，收一点让弹窗更紧凑
  :deep(.arco-result) {
    padding: 16px 32px;
  }
}
</style>

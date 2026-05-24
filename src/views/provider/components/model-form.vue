<template>
  <a-drawer
    :visible="visible"
    :width="600"
    :title="isEdit ? '编辑模型' : '新建模型'"
    :mask-closable="false"
    unmount-on-close
    @cancel="handleClose"
    @ok="handleSubmit"
    :ok-loading="submitLoading"
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
          :disabled="isProviderLocked"
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { modelApi } from '@/api/model'
import type { ProviderModel, Provider, ModelCreateRequest } from '@/types'

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

interface Props {
  visible: boolean
  isEdit: boolean
  model?: ProviderModel
  providerList: Provider[]
  defaultProviderId?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const submitLoading = ref(false)

const isProviderLocked = computed(() => !props.isEdit && !!props.defaultProviderId)

function createEmptyForm(): Partial<ModelCreateRequest> & { status?: number } {
  return {
    provider_id: props.defaultProviderId,
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

watch(() => props.visible, (val) => {
  if (!val) return
  if (props.isEdit && props.model) {
    Object.assign(formData, {
      provider_id: props.model.provider_id,
      model_name: props.model.model_name,
      provider_model: props.model.provider_model,
      weight: props.model.weight,
      priority: props.model.priority,
      max_context: props.model.max_context,
      input_price: props.model.input_price,
      output_price: props.model.output_price,
      currency: props.model.currency,
      routing_strategy: props.model.routing_strategy,
      status: props.model.status,
    })
  } else {
    Object.assign(formData, createEmptyForm())
  }
})

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const errors = await formRef.value?.validate()
  if (errors) return

  submitLoading.value = true
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

    if (props.isEdit && props.model) {
      await modelApi.update(props.model.id, {
        ...payload,
        status: formData.status,
      })
      Message.success('更新成功')
    } else {
      await modelApi.create(payload as ModelCreateRequest)
      Message.success('创建成功')
    }

    emit('update:visible', false)
    emit('success')
  } catch {
    Message.error(props.isEdit ? '更新失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

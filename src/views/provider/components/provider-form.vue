<template>
  <a-drawer
    :visible="visible"
    :width="520"
    :title="isEdit ? '编辑供应商' : '添加供应商'"
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
      <a-form-item field="name" label="标识">
        <a-input
          v-model="formData.name"
          placeholder="唯一标识，如 openai-main"
          :disabled="isEdit"
        />
      </a-form-item>

      <a-form-item field="display_name" label="显示名称">
        <a-input
          v-model="formData.display_name"
          placeholder="供应商显示名称"
        />
      </a-form-item>

      <a-form-item field="adapter_type" label="适配器类型">
        <a-select
          v-model="formData.adapter_type"
          placeholder="选择适配器类型"
          :disabled="isEdit"
        >
          <a-option
            v-for="adapter in adapterList"
            :key="adapter.type"
            :value="adapter.type"
            :label="adapter.display_name"
          />
        </a-select>
      </a-form-item>

      <a-form-item field="base_url" label="Base URL">
        <a-input
          v-model="formData.base_url"
          placeholder="https://api.example.com/v1"
        />
      </a-form-item>

      <a-form-item field="api_key" label="API Key">
        <a-input-password
          v-model="formData.api_key"
          :placeholder="isEdit ? '留空则不修改' : '输入 API Key'"
        />
      </a-form-item>

      <a-form-item field="extra_config" label="扩展配置">
        <a-textarea
          v-model="extraConfigStr"
          placeholder='JSON 格式，如 {"timeout": 30}'
          :auto-size="{ minRows: 3, maxRows: 8 }"
        />
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { providerApi } from '@/api/provider'
import type { Provider, Adapter, ProviderCreateRequest } from '@/types'

interface Props {
  visible: boolean
  isEdit: boolean
  provider?: Provider
  adapterList: Adapter[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const submitLoading = ref(false)
const extraConfigStr = ref('')

const formData = reactive<ProviderCreateRequest & { api_key?: string }>({
  name: '',
  display_name: '',
  adapter_type: '',
  base_url: '',
  api_key: '',
  extra_config: undefined,
})

const formRules = {
  name: [{ required: true, message: '请输入标识' }],
  display_name: [{ required: true, message: '请输入显示名称' }],
  adapter_type: [{ required: true, message: '请选择适配器类型' }],
}

function resetForm() {
  formData.name = ''
  formData.display_name = ''
  formData.adapter_type = ''
  formData.base_url = ''
  formData.api_key = ''
  formData.extra_config = undefined
  extraConfigStr.value = ''
}

watch(() => props.visible, (val) => {
  if (!val) return
  if (props.isEdit && props.provider) {
    formData.name = props.provider.name
    formData.display_name = props.provider.display_name
    formData.adapter_type = props.provider.adapter_type
    formData.base_url = props.provider.base_url || ''
    formData.api_key = ''
    formData.extra_config = props.provider.extra_config
    extraConfigStr.value = props.provider.extra_config
      ? JSON.stringify(props.provider.extra_config, null, 2)
      : ''
  } else {
    resetForm()
  }
})

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const errors = await formRef.value?.validate()
  if (errors) return

  let extraConfig: Record<string, unknown> | undefined
  if (extraConfigStr.value.trim()) {
    try {
      extraConfig = JSON.parse(extraConfigStr.value)
    } catch {
      Message.error('扩展配置不是有效的 JSON 格式')
      return
    }
  }

  submitLoading.value = true
  try {
    const payload: Partial<ProviderCreateRequest> & { api_key?: string } = {
      name: formData.name,
      display_name: formData.display_name,
      adapter_type: formData.adapter_type,
      base_url: formData.base_url || undefined,
      api_key: formData.api_key || undefined,
      extra_config: extraConfig,
    }

    if (props.isEdit && props.provider) {
      await providerApi.update(props.provider.id, payload)
      Message.success('更新成功')
    } else {
      await providerApi.create(payload as ProviderCreateRequest)
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

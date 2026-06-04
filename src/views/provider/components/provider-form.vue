<template>
  <a-drawer
    :visible="visible"
    :width="520"
    :title="isEdit ? t('provider.editProvider') : t('provider.addProvider')"
    :mask-closable="false"
    unmount-on-close
    :ok-loading="submitLoading"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <a-form-item field="name" :label="t('provider.name')">
        <a-input
          v-model="formData.name"
          :placeholder="t('provider.namePlaceholder')"
          :disabled="isEdit"
        />
      </a-form-item>

      <a-form-item field="display_name" :label="t('provider.displayName')">
        <a-input
          v-model="formData.display_name"
          :placeholder="t('provider.displayNamePlaceholder')"
        />
      </a-form-item>

      <a-form-item field="adapter_type" :label="t('provider.adapterType')">
        <a-select
          v-model="formData.adapter_type"
          :placeholder="t('provider.adapterTypePlaceholder')"
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

      <a-form-item field="base_url" :label="t('provider.baseUrl')">
        <a-input v-model="formData.base_url" :placeholder="t('provider.baseUrlPlaceholder')" />
      </a-form-item>

      <a-form-item field="api_key" :label="t('provider.apiKey')">
        <a-input-password
          v-model="formData.api_key"
          :placeholder="
            isEdit ? t('provider.apiKeyEditPlaceholder') : t('provider.apiKeyCreatePlaceholder')
          "
        />
      </a-form-item>

      <a-form-item field="extra_config" :label="t('provider.extraConfig')">
        <a-textarea
          v-model="extraConfigStr"
          :placeholder="t('provider.extraConfigPlaceholder')"
          :auto-size="{ minRows: 3, maxRows: 8 }"
        />
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { providerApi } from '@/api/provider'
import type { Provider, Adapter, ProviderCreateRequest } from '@/types'

const { t } = useI18n()

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
  name: [{ required: true, message: t('provider.nameRequired') }],
  display_name: [{ required: true, message: t('provider.displayNameRequired') }],
  adapter_type: [{ required: true, message: t('provider.adapterTypeRequired') }],
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

watch(
  () => props.visible,
  (val) => {
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
  },
)

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
      Message.error(t('provider.extraConfigInvalidJson'))
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
      Message.success(t('common.updateSuccess'))
    } else {
      await providerApi.create(payload as ProviderCreateRequest)
      Message.success(t('common.createSuccess'))
    }

    emit('update:visible', false)
    emit('success')
  } catch {
    Message.error(t('common.operationFail'))
  } finally {
    submitLoading.value = false
  }
}
</script>

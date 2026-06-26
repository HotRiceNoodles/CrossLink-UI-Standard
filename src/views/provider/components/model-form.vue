<template>
  <a-drawer
    :visible="visible"
    :width="600"
    :title="isEdit ? t('model.editModel') : t('model.newModel')"
    :mask-closable="false"
    unmount-on-close
    :ok-loading="submitLoading"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <a-form-item
        field="provider_id"
        :label="t('model.providerLabel')"
        :rules="[{ required: true, message: t('model.providerRequired') }]"
      >
        <a-select
          v-model="formData.provider_id"
          :placeholder="t('model.providerPlaceholder')"
          :disabled="isProviderLocked"
        >
          <a-option v-for="p in providerList" :key="p.id" :value="p.id" :label="p.display_name" />
        </a-select>
      </a-form-item>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item
            field="model_name"
            :label="t('model.modelNameLabel')"
            :rules="[{ required: true, message: t('model.modelNameRequired') }]"
          >
            <a-input v-model="formData.model_name" :placeholder="t('model.modelNamePlaceholder')" />
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="12">
          <a-form-item
            field="provider_model"
            :label="t('model.providerModelLabel')"
            :rules="[{ required: true, message: t('model.providerModelRequired') }]"
          >
            <a-input
              v-model="formData.provider_model"
              :placeholder="t('model.providerModelPlaceholder')"
            />
          </a-form-item>
        </a-grid-item>
      </a-grid>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item field="weight" :label="t('model.weightLabel')">
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
          <a-form-item field="priority" :label="t('model.priorityLabel')">
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

      <a-form-item field="max_context" :label="t('model.maxContext')">
        <a-input-number
          v-model="formData.max_context"
          :min="0"
          :placeholder="t('model.maxContextPlaceholder')"
          style="width: 100%"
        />
      </a-form-item>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item field="input_price" :label="t('model.inputPriceLabel')">
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
          <a-form-item field="output_price" :label="t('model.outputPriceLabel')">
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
          <a-form-item field="currency" :label="t('model.currencyLabel')">
            <a-select v-model="formData.currency" :placeholder="t('model.currencyPlaceholder')">
              <a-option value="CNY" label="CNY" />
              <a-option value="USD" label="USD" />
            </a-select>
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="12">
          <a-form-item field="routing_strategy" :label="t('model.routingStrategyLabel')">
            <a-select
              v-model="formData.routing_strategy"
              :placeholder="t('model.routingStrategyPlaceholder')"
            >
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

      <a-form-item field="supports_responses" :label="t('model.supportsResponsesLabel')">
        <a-switch v-model="supportsResponses" />
        <span class="supports-responses-helper">{{ t('model.supportsResponsesHelper') }}</span>
      </a-form-item>

      <a-form-item v-if="isEdit" field="status" :label="t('model.statusLabel')">
        <a-select v-model="formData.status" :placeholder="t('model.statusPlaceholder')">
          <a-option :value="1" :label="t('common.enabled')" />
          <a-option :value="0" :label="t('common.disabled')" />
        </a-select>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { modelApi } from '@/api/model'
import type { ProviderModel, Provider, ModelCreateRequest } from '@/types'

const { t } = useI18n()

const strategyMap: Record<string, { label: string; color: string }> = {
  weighted_random: { label: 'strategy.weighted_random', color: '#165DFF' },
  round_robin: { label: 'strategy.round_robin', color: '#00B42A' },
  least_latency: { label: 'strategy.least_latency', color: '#0FC6C2' },
  least_cost: { label: 'strategy.least_cost', color: '#FF7D00' },
  canary: { label: 'strategy.canary', color: '#722ED1' },
  least_busy: { label: 'strategy.least_busy', color: '#F77234' },
}

const strategyOptions = computed(() =>
  Object.entries(strategyMap).map(([value, { label }]) => ({
    value,
    label: t(label),
  })),
)

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
const supportsResponses = ref(false)

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
  provider_id: [{ required: true, message: t('model.providerRequired') }],
  model_name: [{ required: true, message: t('model.modelNameRequired') }],
  provider_model: [{ required: true, message: t('model.providerModelRequired') }],
}

watch(
  () => props.visible,
  (val) => {
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
      supportsResponses.value = Boolean(props.model.extra_config?.supports_responses)
    } else {
      Object.assign(formData, createEmptyForm())
      supportsResponses.value = false
    }
  },
)

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const errors = await formRef.value?.validate()
  if (errors) return

  submitLoading.value = true
  try {
    // Preserve any pre-existing extra_config keys and surface the
    // /v1/responses passthrough flag the gateway reads (supports_responses).
    const baseExtraConfig =
      (props.isEdit && props.model?.extra_config) || formData.extra_config || {}
    const extra_config: Record<string, unknown> = {
      ...baseExtraConfig,
      supports_responses: supportsResponses.value,
    }

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
      extra_config,
    }

    if (props.isEdit && props.model) {
      await modelApi.update(props.model.id, {
        ...payload,
        status: formData.status,
      })
      Message.success(t('common.updateSuccess'))
    } else {
      await modelApi.create(payload as ModelCreateRequest)
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

<style scoped>
.supports-responses-helper {
  display: block;
  margin-top: 4px;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}
</style>

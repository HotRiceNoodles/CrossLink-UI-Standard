<template>
  <a-drawer
    :visible="visible"
    :width="560"
    :title="isEdit ? t('auth.teams.editTeam') : t('auth.teams.createTeam')"
    :mask-closable="false"
    unmount-on-close
    :ok-loading="submitLoading"
    @cancel="emit('close')"
    @ok="emit('submit')"
  >
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <a-form-item field="name" :label="t('auth.teams.tableName')">
        <a-input
          :model-value="formData.name"
          :placeholder="t('auth.teams.namePlaceholder')"
          @update:model-value="(val: string) => emit('updateField', 'name', val)"
        />
      </a-form-item>

      <a-form-item field="display_name" :label="t('auth.teams.tableDisplayName')">
        <a-input
          :model-value="formData.display_name"
          :placeholder="t('auth.teams.displayNamePlaceholder')"
          @update:model-value="(val: string) => emit('updateField', 'display_name', val)"
        />
      </a-form-item>

      <a-form-item field="description" :label="t('auth.teams.tableDescription')">
        <a-textarea
          :model-value="formData.description"
          :placeholder="t('auth.teams.descriptionPlaceholder')"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          @update:model-value="(val: string) => emit('updateField', 'description', val)"
        />
      </a-form-item>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item field="budget_limit" :label="t('key.budgetLimitLabel')">
            <a-input-number
              :model-value="formData.budget_limit"
              :min="0"
              :precision="2"
              :placeholder="t('key.budgetPlaceholder')"
              style="width: 100%"
              @update:model-value="
                (val: number | undefined) => emit('updateField', 'budget_limit', val ?? null)
              "
            />
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="12">
          <a-form-item field="budget_period" :label="t('key.budgetPeriodLabel')">
            <a-select
              :model-value="formData.budget_period"
              :placeholder="t('key.budgetPeriodPlaceholder')"
              @update:model-value="(val: string) => emit('updateField', 'budget_period', val)"
            >
              <a-option value="daily" :label="t('key.periodDaily')" />
              <a-option value="weekly" :label="t('key.periodWeekly')" />
              <a-option value="monthly" :label="t('key.periodMonthly')" />
            </a-select>
          </a-form-item>
        </a-grid-item>
      </a-grid>

      <a-grid :cols="24" :col-gap="16">
        <a-grid-item :span="12">
          <a-form-item field="tpm_limit" :label="t('key.tpmLimitLabel')">
            <a-input-number
              :model-value="formData.tpm_limit"
              :min="0"
              :placeholder="t('key.limitPlaceholder')"
              style="width: 100%"
              @update:model-value="
                (val: number | undefined) => emit('updateField', 'tpm_limit', val ?? 0)
              "
            />
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="12">
          <a-form-item field="rpm_limit" :label="t('key.rpmLimitLabel')">
            <a-input-number
              :model-value="formData.rpm_limit"
              :min="0"
              :placeholder="t('key.limitPlaceholder')"
              style="width: 100%"
              @update:model-value="
                (val: number | undefined) => emit('updateField', 'rpm_limit', val ?? 0)
              "
            />
          </a-form-item>
        </a-grid-item>
      </a-grid>

      <a-form-item v-if="isEdit" field="status" :label="t('common.status')">
        <a-select
          :model-value="formData.status"
          @update:model-value="(val: number) => emit('updateField', 'status', val)"
        >
          <a-option :value="1" :label="t('common.enabled')" />
          <a-option :value="0" :label="t('common.disabled')" />
        </a-select>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const formRef = ref()

defineProps<{
  visible: boolean
  formData: Record<string, unknown>
  isEdit: boolean
  submitLoading: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: []
  updateField: [field: string, value: unknown]
}>()

const formRules = {
  name: [{ required: true, message: t('auth.teams.nameRequired') }],
  display_name: [{ required: true, message: t('auth.teams.displayNameRequired') }],
}

defineExpose({ formRef })
</script>

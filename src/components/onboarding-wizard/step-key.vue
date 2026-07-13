<template>
  <div class="step-key">
    <a-form :model="keyForm" layout="vertical">
      <a-form-item field="name" :label="t('onboarding.keyName')" required>
        <a-input
          v-model="keyForm.name"
          :placeholder="t('onboarding.keyNamePlaceholder')"
          allow-clear
        />
      </a-form-item>

      <a-collapse :bordered="false" expand-icon-position="right">
        <a-collapse-item key="adv" :header="t('onboarding.advanced')">
          <a-grid :cols="24" :col-gap="16" :row-gap="0">
            <a-grid-item :span="12">
              <a-form-item field="tpm_limit" :label="t('onboarding.tpmLabel')">
                <a-input-number
                  v-model="keyForm.tpm_limit"
                  :min="0"
                  :placeholder="t('onboarding.optional')"
                  style="width: 100%"
                />
              </a-form-item>
            </a-grid-item>
            <a-grid-item :span="12">
              <a-form-item field="rpm_limit" :label="t('onboarding.rpmLabel')">
                <a-input-number
                  v-model="keyForm.rpm_limit"
                  :min="0"
                  :placeholder="t('onboarding.optional')"
                  style="width: 100%"
                />
              </a-form-item>
            </a-grid-item>
          </a-grid>

          <a-grid :cols="24" :col-gap="16" :row-gap="0">
            <a-grid-item :span="12">
              <a-form-item field="max_budget" :label="t('onboarding.budgetLabel')">
                <a-input-number
                  v-model="keyForm.max_budget"
                  :min="0"
                  :precision="2"
                  :placeholder="t('onboarding.optional')"
                  style="width: 100%"
                />
              </a-form-item>
            </a-grid-item>
            <a-grid-item :span="12">
              <a-form-item field="budget_period" :label="t('onboarding.budgetPeriod')">
                <a-select v-model="keyForm.budget_period">
                  <a-option value="daily" label="daily" />
                  <a-option value="weekly" label="weekly" />
                  <a-option value="monthly" label="monthly" />
                </a-select>
              </a-form-item>
            </a-grid-item>
          </a-grid>
        </a-collapse-item>
      </a-collapse>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { OnboardingWizardKey } from '@/composables/use-onboarding-wizard'

const { t } = useI18n()
const { keyForm } = inject(OnboardingWizardKey)!
</script>

<style scoped lang="less">
.step-key {
  padding-top: 4px;
}
</style>

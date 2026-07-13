<template>
  <div class="step-adapter">
    <div class="step-head">
      <h4>{{ t('onboarding.adapterTitle') }}</h4>
      <p class="step-desc">{{ t('onboarding.adapterDesc') }}</p>
    </div>

    <a-spin :loading="loadingAdapters" class="adapter-grid-spin">
      <div class="adapter-grid">
        <div
          v-for="a in adapters"
          :key="a.type"
          class="adapter-card"
          :class="{
            'adapter-card--active': provider.adapter_type === a.type,
            'adapter-card--recommended':
              inferredAdapter === a.type && provider.adapter_type !== a.type,
          }"
          role="button"
          tabindex="0"
          @click="selectAdapter(a.type)"
          @keydown.enter="selectAdapter(a.type)"
        >
          <div class="adapter-card__head">
            <span class="adapter-card__name">{{ a.display_name || a.type }}</span>
            <a-tag v-if="inferredAdapter === a.type" color="arcoblue" size="small">
              {{ t('onboarding.modeQuickBadge') }}
            </a-tag>
          </div>
          <p class="adapter-card__desc">{{ a.description || a.type }}</p>
          <div class="adapter-card__meta">
            <a-tag v-if="a.needs_base_url" size="small">{{ t('onboarding.needsUrl') }}</a-tag>
            <a-tag v-if="a.needs_api_key" size="small">{{ t('onboarding.needsKey') }}</a-tag>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { inject } from 'vue'
import { OnboardingWizardKey } from '@/composables/use-onboarding-wizard'

const { t } = useI18n()
const w = inject(OnboardingWizardKey)!
const { adapters, provider, inferredAdapter, selectAdapter } = w

const loadingAdapters = ref(false)
onMounted(async () => {
  loadingAdapters.value = true
  await w.loadAdapters()
  loadingAdapters.value = false
})
</script>

<style scoped lang="less">
.step-head {
  margin-bottom: 16px;
  h4 {
    margin: 0 0 4px;
    font-size: 15px;
  }
}
.step-desc {
  margin: 0;
  color: var(--color-text-3);
  font-size: 13px;
}
.adapter-grid-spin {
  display: block;
}
.adapter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.adapter-card {
  padding: 14px;
  border: 1px solid var(--color-fill-3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: rgb(var(--primary-5));
  }
  &--active {
    border-color: rgb(var(--primary-6));
    background: var(--color-fill-1);
  }
  &--recommended {
    border-color: rgb(var(--primary-5));
  }
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  &__name {
    font-weight: 600;
    font-size: 14px;
  }
  &__desc {
    margin: 0 0 8px;
    color: var(--color-text-2);
    font-size: 12px;
    line-height: 1.5;
    min-height: 32px;
  }
  &__meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
}
</style>

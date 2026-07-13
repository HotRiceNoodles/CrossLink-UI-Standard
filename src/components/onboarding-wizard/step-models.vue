<template>
  <div class="step-models">
    <div class="step-head">
      <h4>{{ t('onboarding.selectModels') }}</h4>
      <p class="step-desc">{{ t('onboarding.defaultSelectedHint') }}</p>
    </div>

    <!-- 探测拿到模型：分类勾选 -->
    <template v-if="hasModelsFromProbe">
      <div class="models-found">
        {{ t('onboarding.modelsFound', { n: probeModels.length }) }}
      </div>
      <a-collapse v-model:active-key="openCats">
        <a-collapse-item
          v-for="cat in groupedModels"
          :key="cat.key"
          :header="`${cat.label} (${cat.items.length})`"
        >
          <div class="model-list">
            <a-checkbox
              v-for="m in cat.items"
              :key="m.id"
              :model-value="selectedModels.includes(m.id)"
              @change="toggleModel(m.id)"
            >
              <span class="model-id">{{ m.id }}</span>
              <span v-if="m.owned_by" class="model-owner">{{ m.owned_by }}</span>
            </a-checkbox>
          </div>
        </a-collapse-item>
      </a-collapse>
    </template>

    <!-- 手填模式：探测不支持 / 0 模型 -->
    <template v-else>
      <a-alert
        v-if="probeResult?.success && !probeResult.models_supported"
        type="info"
        class="manual-hint"
      >
        {{ t('onboarding.probeOkNoModels') }}
      </a-alert>
      <p class="manual-hint-text">{{ t('onboarding.manualHint') }}</p>

      <a-input-search
        v-model="manualInput"
        :placeholder="t('onboarding.manualPlaceholder')"
        :button-text="t('onboarding.add')"
        @search="addManualModel(manualInput)"
        @press-enter="addManualModel(manualInput)"
      />

      <!-- 常用模型 chip -->
      <div v-if="presets.length" class="presets">
        <div class="presets__title">{{ t('onboarding.presetTitle') }}</div>
        <a-space wrap>
          <a-tag
            v-for="p in presets"
            :key="p"
            checkable
            :checked="manualModels.includes(p)"
            @check="onPresetToggle(p, $event)"
          >
            {{ p }}
          </a-tag>
        </a-space>
      </div>

      <!-- 已选手填模型 -->
      <div v-if="manualModels.length" class="manual-selected">
        <a-tag v-for="m in manualModels" :key="m" closable @close="removeManualModel(m)">
          {{ m }}
        </a-tag>
      </div>
    </template>

    <div class="selected-count">
      {{ t('onboarding.modelCount', { n: effectiveModels.length }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  OnboardingWizardKey,
  MODEL_CATEGORIES,
  categorizeModel,
  MANUAL_MODEL_PRESETS,
} from '@/composables/use-onboarding-wizard'

const { t } = useI18n()
const w = inject(OnboardingWizardKey)!
const {
  probeModels,
  probeResult,
  selectedModels,
  manualModels,
  manualInput,
  hasModelsFromProbe,
  effectiveModels,
  toggleModel,
  addManualModel,
  removeManualModel,
  provider,
} = w

// 按 category 分组；只渲染有模型的分组，外加 other 兜底
const groupedModels = computed(() => {
  const buckets: Record<string, { id: string; owned_by?: string }[]> = {}
  for (const c of MODEL_CATEGORIES) buckets[c.key] = []
  buckets.other = []
  for (const m of probeModels.value) {
    const k = categorizeModel(m.id)
    ;(buckets[k] || (buckets[k] = [])).push(m)
  }
  return MODEL_CATEGORIES.filter((c) => (buckets[c.key] ?? []).length > 0)
    .map((c) => ({ key: c.key, label: t(c.label), items: buckets[c.key] }))
    .concat(
      (buckets.other ?? []).length
        ? [{ key: 'other', label: t('onboarding.catOther'), items: buckets.other }]
        : [],
    )
})

// 默认只展开"对话"组
const openCats = ref<string[]>(['chat'])

const presets = computed<string[]>(() => MANUAL_MODEL_PRESETS[provider.adapter_type] ?? [])

function onPresetToggle(p: string, checked: boolean | (string | number | boolean)[]) {
  const on = Array.isArray(checked) ? checked.includes(p) : checked
  if (on) {
    if (!manualModels.value.includes(p)) manualModels.value.push(p)
  } else {
    removeManualModel(p)
  }
}
</script>

<style scoped lang="less">
.step-head {
  margin-bottom: 12px;
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
.models-found {
  margin-bottom: 12px;
  color: var(--color-text-2);
  font-size: 13px;
}
.model-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
}
.model-id {
  font-family: monospace;
}
.model-owner {
  margin-left: 8px;
  color: var(--color-text-3);
  font-size: 12px;
}
.manual-hint {
  margin-bottom: 12px;
}
.manual-hint-text {
  color: var(--color-text-2);
  font-size: 13px;
  margin: 12px 0;
}
.presets {
  margin-top: 16px;
  &__title {
    color: var(--color-text-3);
    font-size: 12px;
    margin-bottom: 8px;
  }
}
.manual-selected {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.selected-count {
  margin-top: 16px;
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 500;
}
</style>

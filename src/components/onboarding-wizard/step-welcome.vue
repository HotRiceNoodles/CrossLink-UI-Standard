<template>
  <div class="welcome">
    <div class="welcome-head">
      <h3>{{ t('onboarding.welcomeTitle') }}</h3>
      <p class="intro">{{ t('onboarding.welcomeIntro') }}</p>
    </div>

    <div class="mode-cards">
      <div
        class="mode-card"
        role="button"
        tabindex="0"
        @click="emit('select', 'quick')"
        @keydown.enter="emit('select', 'quick')"
      >
        <div class="mode-card__head">
          <span class="mode-card__title">{{ t('onboarding.modeQuick') }}</span>
          <a-tag color="green" size="small">{{ t('onboarding.modeQuickBadge') }}</a-tag>
        </div>
        <p class="mode-card__desc">{{ t('onboarding.modeQuickDesc') }}</p>
        <div class="mode-card__meta">3 {{ t('onboarding.stepResult') }}</div>
      </div>

      <div
        class="mode-card"
        role="button"
        tabindex="0"
        @click="emit('select', 'custom')"
        @keydown.enter="emit('select', 'custom')"
      >
        <div class="mode-card__head">
          <span class="mode-card__title">{{ t('onboarding.modeCustom') }}</span>
        </div>
        <p class="mode-card__desc">{{ t('onboarding.modeCustomDesc') }}</p>
        <div class="mode-card__meta">5 {{ t('onboarding.stepResult') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OnboardingMode } from '@/types'

const { t } = useI18n()
const emit = defineEmits<{ select: [OnboardingMode] }>()
</script>

<style scoped lang="less">
.welcome {
  text-align: center;
  padding: 16px 8px;
}
.welcome-head h3 {
  margin: 0 0 8px;
  font-size: 20px;
}
.intro {
  margin: 0 auto 28px;
  max-width: 460px;
  color: var(--color-text-2);
  font-size: 14px;
}
.mode-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.mode-card {
  text-align: start;
  padding: 20px;
  border: 1px solid var(--color-fill-3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: rgb(var(--primary-6));
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  }
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  &__title {
    font-size: 15px;
    font-weight: 600;
  }
  &__desc {
    margin: 0 0 12px;
    color: var(--color-text-2);
    font-size: 13px;
    line-height: 1.6;
  }
  &__meta {
    color: var(--color-text-3);
    font-size: 12px;
  }
}
</style>

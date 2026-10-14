<template>
  <div class="capability-cards">
    <div v-for="card in cards" :key="card.key" class="cap-card">
      <div class="cap-icon-wrap">
        <component :is="card.icon" class="cap-icon" />
      </div>
      <div class="cap-title">{{ t(card.titleKey) }}</div>
      <div class="cap-desc">{{ t(card.descKey) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconBranch, IconSwap, IconEye, IconSafe } from '@arco-design/web-vue/es/icon'

const { t } = useI18n()

const cards = [
  {
    key: 'routing',
    icon: IconBranch,
    titleKey: 'home.cap.routing.title',
    descKey: 'home.cap.routing.desc',
  },
  {
    key: 'failover',
    icon: IconSwap,
    titleKey: 'home.cap.failover.title',
    descKey: 'home.cap.failover.desc',
  },
  {
    key: 'observability',
    icon: IconEye,
    titleKey: 'home.cap.observability.title',
    descKey: 'home.cap.observability.desc',
  },
  {
    key: 'keyGov',
    icon: IconSafe,
    titleKey: 'home.cap.keyGov.title',
    descKey: 'home.cap.keyGov.desc',
  },
]
</script>

<style scoped lang="less">
.capability-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.cap-card {
  background: var(--color-bg-2);
  border: 1px solid var(--color-fill-1);
  border-radius: var(--cl-radius-xl);
  padding: 26px 24px;
  box-shadow: var(--cl-shadow-card);
  transition:
    transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1),
    box-shadow 0.25s cubic-bezier(0.25, 0.8, 0.25, 1),
    border-color 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: translateY(-3px);
    border-color: rgb(var(--cl-primary-2));
    box-shadow: var(--cl-shadow-raised);
  }
}

.cap-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--cl-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--cl-primary-1));
}

.cap-icon {
  font-size: 22px;
  color: rgb(var(--cl-primary-6));
}

.cap-title {
  margin-top: 14px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.cap-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-3);
}

@media (max-width: 768px) {
  .capability-cards {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .capability-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cap-card {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>

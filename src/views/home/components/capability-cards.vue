<template>
  <div class="capability-cards">
    <div v-for="card in cards" :key="card.key" class="cap-card">
      <component :is="card.icon" class="cap-icon" />
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
  border: 1px solid var(--color-fill-2);
  border-radius: 4px;
  padding: 24px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}

.cap-icon {
  font-size: 24px;
  color: rgb(var(--arcoblue-6));
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
</style>

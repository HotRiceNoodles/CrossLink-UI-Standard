<template>
  <div class="empty-state">
    <!-- 品牌语言插画：五输入 → 单节点，取 logo 母题的灰度版本 -->
    <svg class="empty-state__art" viewBox="0 0 160 96" fill="none" aria-hidden="true">
      <g
        stroke="var(--color-fill-4)"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 20 C 48 22, 42 42, 76 46" />
        <path d="M20 36 C 40 34, 58 42, 76 47" />
        <path d="M20 48 C 40 47, 58 49, 76 48" />
        <path d="M20 60 C 40 62, 58 54, 76 49" />
        <path d="M20 76 C 48 74, 42 54, 76 50" />
        <path d="M84 38 L102 46 Q106 48 102 50 L84 58 Q80 62 80 54 L80 42 Q80 34 84 38 Z" />
      </g>
      <g fill="var(--color-fill-3)">
        <circle cx="20" cy="20" r="4" />
        <circle cx="20" cy="36" r="4" />
        <circle cx="20" cy="48" r="4" />
        <circle cx="20" cy="60" r="4" />
        <circle cx="20" cy="76" r="4" />
      </g>
      <line
        x1="108"
        y1="48"
        x2="140"
        y2="48"
        stroke="var(--color-fill-4)"
        stroke-width="3"
        stroke-linecap="round"
        stroke-dasharray="1 7"
      />
    </svg>
    <div class="empty-state__desc">
      <slot>{{ desc }}</slot>
    </div>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  desc?: string
}>()
</script>

<style scoped lang="less">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;

  &__art {
    width: 140px;
    height: auto;
    margin-bottom: 4px;
  }

  &__desc {
    font-size: 13px;
    color: var(--color-text-3);
  }

  &__action {
    margin-top: 16px;
  }
}
</style>

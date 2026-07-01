<template>
  <a-card class="general-card kpi-card" :class="[`tone-${tone}`, `size-${size}`]">
    <div class="kpi-inner">
      <div class="kpi-info">
        <!--
          Arco's <a-statistic> `format` prop is a *string* (dayjs pattern), not a
          function, so compact formatters can't go through it. When a `format`
          function is supplied we render the value ourselves; otherwise we lean on
          a-statistic for grouping / precision / count-up animation.
        -->
        <span v-if="format" class="kpi-value" :style="valueStyle">
          {{ prefix }}{{ displayValue }}{{ suffix }}
        </span>
        <a-statistic
          v-else
          :value="value"
          :show-group-separator="true"
          :animation="true"
          :precision="precision"
          :value-style="valueStyle"
          :prefix="prefix"
          :suffix="suffix"
        />
        <span class="kpi-label">{{ label }}</span>
        <span v-if="hint" class="kpi-hint">{{ hint }}</span>
      </div>
      <div v-if="icon" class="kpi-icon">
        <component :is="icon" />
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple'
type Size = 'lg' | 'sm'

const props = withDefaults(
  defineProps<{
    value: number
    label: string
    icon?: string
    tone?: Tone
    size?: Size
    precision?: number
    prefix?: string
    suffix?: string
    /** Custom compact formatter (e.g. formatTokensCompact / formatLatency). */
    format?: (value: number) => string
    hint?: string
  }>(),
  {
    tone: 'blue',
    size: 'lg',
  },
)

const displayValue = computed(() => (props.format ? props.format(props.value) : ''))

const valueStyle = computed(() => {
  const fontSize = props.size === 'lg' ? '28px' : '20px'
  const fontWeight = props.size === 'lg' ? 700 : 600
  return { fontSize, fontWeight, lineHeight: 1.2 }
})
</script>

<style scoped lang="less">
.kpi-card {
  height: 100%;
}

.kpi-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kpi-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

// mirrors <a-statistic> number styling for the custom-format branch
.kpi-value {
  display: block;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.kpi-label {
  font-size: 13px;
  color: var(--color-text-3);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-hint {
  font-size: 11px;
  color: var(--color-text-4);
  line-height: 1;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  :deep(.arco-icon) {
    font-size: 22px;
  }
}

// secondary cards: clearly more compact than the primary row
.size-sm {
  :deep(.arco-card-body) {
    padding: 14px 16px;
  }

  .kpi-icon {
    width: 36px;
    height: 36px;

    :deep(.arco-icon) {
      font-size: 18px;
    }
  }

  .kpi-label {
    font-size: 12px;
    color: var(--color-text-4);
  }
}

// tone → arco palette
.tone-blue .kpi-icon {
  background-color: rgba(var(--arcoblue-1), 0.8);
  color: rgb(var(--arcoblue-6));
}
.tone-green .kpi-icon {
  background-color: rgba(var(--green-1), 0.8);
  color: rgb(var(--green-6));
}
.tone-orange .kpi-icon {
  background-color: rgba(var(--orange-1), 0.8);
  color: rgb(var(--orange-6));
}
.tone-red .kpi-icon {
  background-color: rgba(var(--red-1), 0.8);
  color: rgb(var(--red-6));
}
.tone-purple .kpi-icon {
  background-color: rgba(var(--purple-1), 0.8);
  color: rgb(var(--purple-6));
}
</style>

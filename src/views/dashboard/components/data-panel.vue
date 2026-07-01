<template>
  <a-grid :cols="24" :col-gap="16" :row-gap="16" class="data-panel">
    <a-grid-item :span="6">
      <a-card class="general-card kpi-card">
        <div class="kpi-inner">
          <div class="kpi-info">
            <a-statistic
              :value="stats.total_requests"
              :show-group-separator="true"
              :animation="true"
              :value-style="{ fontSize: '28px', fontWeight: 700 }"
            />
            <span class="kpi-label">{{ t('dashboard.totalRequests') }}</span>
          </div>
          <div class="kpi-icon">
            <icon-eye />
          </div>
        </div>
      </a-card>
    </a-grid-item>

    <a-grid-item :span="6">
      <a-card class="general-card kpi-card">
        <div class="kpi-inner">
          <div class="kpi-info">
            <a-statistic
              :value="stats.total_tokens"
              :show-group-separator="true"
              :animation="true"
              :value-style="{ fontSize: '28px', fontWeight: 700 }"
              :format="formatTokensCompact"
            />
            <span class="kpi-label">{{ t('dashboard.tokenUsage') }}</span>
          </div>
          <div class="kpi-icon">
            <icon-code />
          </div>
        </div>
      </a-card>
    </a-grid-item>

    <a-grid-item :span="6">
      <a-card class="general-card kpi-card">
        <div class="kpi-inner">
          <div class="kpi-info">
            <a-statistic
              :value="stats.total_cost"
              :show-group-separator="true"
              :animation="true"
              :precision="2"
              :value-style="{ fontSize: '28px', fontWeight: 700 }"
              :prefix="currencySymbol"
            />
            <span class="kpi-label">{{ t('dashboard.totalCost') }}</span>
          </div>
          <div class="kpi-icon">
            <icon-storage />
          </div>
        </div>
      </a-card>
    </a-grid-item>

    <a-grid-item :span="6">
      <a-card class="general-card kpi-card">
        <div class="kpi-inner">
          <div class="kpi-info">
            <a-statistic
              :value="stats.avg_latency_ms"
              :show-group-separator="true"
              :animation="true"
              :precision="0"
              :value-style="{ fontSize: '28px', fontWeight: 700 }"
              suffix="ms"
            />
            <span class="kpi-label">{{ t('dashboard.avgLatency') }}</span>
          </div>
          <div class="kpi-icon">
            <icon-send />
          </div>
        </div>
      </a-card>
    </a-grid-item>
  </a-grid>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTokensCompact } from '@/utils/format'
import type { UsageStats } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  stats: UsageStats
}>()

const currencySymbol = computed(() => {
  const currencies = Object.keys(props.stats.cost_by_currency || {})
  if (currencies.length === 0) return '$'
  const map: Record<string, string> = {
    USD: '$',
    CNY: '¥',
    EUR: '€',
    GBP: '£',
  }
  return map[currencies[0]] || currencies[0]
})
</script>

<style scoped lang="less">
.data-panel {
  margin-bottom: 16px;
}

.kpi-card {
  height: 100%;
}

.kpi-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.kpi-label {
  font-size: 13px;
  color: var(--color-text-3);
  line-height: 1;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(var(--arcoblue-1), 0.8);
  color: rgb(var(--arcoblue-6));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  :deep(.arco-icon) {
    font-size: 22px;
  }
}
</style>

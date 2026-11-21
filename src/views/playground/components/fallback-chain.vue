<template>
  <a-popover v-if="fallback && fallback.count > 0" position="top">
    <span class="usage-tag fallback-tag">
      <icon-exclamation-circle style="font-size: 12px" />
      {{ t('playground.failoverSwitches', { n: fallback.count }) }}
    </span>
    <template #content>
      <div class="fallback-panel">
        <div class="fallback-title">{{ t('playground.failoverTitle') }}</div>
        <table class="fallback-table">
          <thead>
            <tr>
              <th>{{ t('playground.failoverProvider') }}</th>
              <th>{{ t('playground.failoverModel') }}</th>
              <th>{{ t('playground.failoverStatus') }}</th>
              <th>{{ t('playground.failoverLatency') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a, i) in fallback.attempts" :key="i">
              <td>{{ a.provider }}</td>
              <td>{{ a.model }}</td>
              <td>
                <span v-if="a.success" class="fb-ok">{{ t('playground.failoverSuccess') }}</span>
                <span v-else-if="a.skipped" class="fb-skip">
                  {{ t('playground.failoverSkipped') }}
                </span>
                <span v-else class="fb-fail">
                  {{ t('playground.failoverFailed') }}
                  <span v-if="a.error_type">({{ a.error_type }})</span>
                </span>
              </td>
              <td>{{ a.latency_ms != null ? `${a.latency_ms}ms` : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </a-popover>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PlaygroundFallback } from '@/types'

defineProps<{ fallback?: PlaygroundFallback | null }>()

const { t } = useI18n()
</script>

<style scoped lang="less">
.usage-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 2px;
}

.fallback-tag {
  color: rgb(var(--orange-6));
  background: rgba(var(--orange-1), 0.6);
}

.fallback-panel {
  max-width: 420px;

  .fallback-title {
    font-weight: 600;
    margin-bottom: 6px;
  }

  .fallback-table {
    font-size: 12px;
    border-collapse: collapse;

    th,
    td {
      padding: 3px 8px;
      text-align: left;
      border-bottom: 1px solid var(--color-fill-2);
    }

    .fb-ok {
      color: rgb(var(--green-6));
    }

    .fb-skip {
      color: var(--color-text-3);
    }

    .fb-fail {
      color: rgb(var(--red-6));
    }
  }
}
</style>

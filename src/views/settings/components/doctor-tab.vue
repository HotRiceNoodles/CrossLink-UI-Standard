<template>
  <div class="doctor-tab">
    <a-spin :loading="loading" style="width: 100%">
      <div class="tab-body">
        <div class="tab-toolbar">
          <span v-if="report" class="generated-at">
            {{ t('doctor.generatedAt') }}: {{ formatTime(report.generated_at) }}
          </span>
          <a-button size="small" :loading="loading" @click="load">
            <template #icon><icon-refresh /></template>
            {{ t('doctor.refresh') }}
          </a-button>
        </div>

        <a-alert v-if="loadError" type="error">{{ t('doctor.loadFail') }}</a-alert>

        <template v-if="report">
          <!-- Summary: severity counts + tier + setup flag -->
          <div class="summary-bar">
            <a-tag v-for="s in SEVERITIES" :key="s" :color="SEVERITY_COLORS[s]" size="large">
              {{ t(`doctor.summary.${s}`) }}: {{ report.summary[s] }}
            </a-tag>
            <a-tag size="large" color="gray">{{ t('doctor.tier') }}: {{ report.tier }}</a-tag>
            <a-tag v-if="report.setup_needed" size="large" color="orange">
              {{ t('doctor.setupNeeded') }}
            </a-tag>
          </div>

          <!-- Checks -->
          <div class="check-list">
            <div v-for="check in report.checks" :key="check.id" class="check-item">
              <div class="check-title">
                <span class="severity-dot" :class="check.severity" />
                <span class="check-name">{{ t(check.title_key) }}</span>
                <a-button
                  v-if="check.fix_action === 'open_wizard' && canSetup"
                  type="text"
                  size="mini"
                  @click="runSetup"
                >
                  {{ t('setup.reopen') }}
                </a-button>
              </div>
              <div class="check-detail">
                {{ t(check.detail_key, check.detail_params ?? {}) }}
              </div>
              <div v-if="check.fix_hint_key" class="check-hint">
                {{ t('doctor.fixHint') }}{{ t(check.fix_hint_key) }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { readinessApi } from '@/api/readiness'
import { useLoading } from '@/hooks/loading'
import { useUserStore } from '@/store/modules/user'
import { formatTime } from '@/utils/format'
import { SETUP_REOPEN_EVENT } from '@/composables/use-system-setup'
import type { ReadinessReport, ReadinessSeverity } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()
const { loading, setLoading } = useLoading(true)

const report = ref<ReadinessReport | null>(null)
const loadError = ref(false)

const SEVERITIES: ReadinessSeverity[] = ['danger', 'warn', 'info', 'ok']
const SEVERITY_COLORS: Record<ReadinessSeverity, string> = {
  danger: 'red',
  warn: 'orangered',
  info: 'arcoblue',
  ok: 'green',
}

const canSetup = computed(() => userStore.hasPermission('system:update'))

function runSetup() {
  window.dispatchEvent(new CustomEvent(SETUP_REOPEN_EVENT))
}

async function load() {
  setLoading(true)
  loadError.value = false
  try {
    const res = await readinessApi.get()
    report.value = res.data
  } catch {
    loadError.value = true
  } finally {
    setLoading(false)
  }
}

onMounted(load)
</script>

<style scoped lang="less">
.doctor-tab {
  .tab-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.generated-at {
  font-size: 12px;
  color: var(--color-text-3);
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.check-item {
  padding: 10px 14px;
  background-color: var(--color-fill-1);
  border-radius: 6px;
}

.check-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.severity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.danger {
    background-color: rgb(var(--red-6));
  }

  &.warn {
    background-color: rgb(var(--orange-6));
  }

  &.info {
    background-color: rgb(var(--arcoblue-6));
  }

  &.ok {
    background-color: rgb(var(--green-6));
  }
}

.check-detail {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-2);
}

.check-hint {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-3);
}
</style>

<template>
  <div class="debug-detail-page">
    <a-card class="general-card">
      <template #title>
        <div class="header-row">
          <a-button size="small" type="text" @click="router.back()">
            <template #icon><icon-left /></template>
            {{ t('requestDebug.back') }}
          </a-button>
          <a-divider direction="vertical" />
          <span v-if="detail" class="detail-id">{{ detail.id }}</span>
          <a-tag v-if="detail" :color="statusColor(detail.resp_status)" size="small">
            {{ detail.resp_status }}
          </a-tag>
          <span v-if="model" class="detail-model">{{ model }}</span>
          <span v-if="detail" class="detail-path">{{ detail.method }} {{ detail.path }}</span>
          <!-- Replay: only chat/messages entries, never truncated ones; quota is consumed -->
          <a-button
            v-if="detail && replayable"
            size="small"
            type="outline"
            @click="replayVisible = true"
          >
            <template #icon><icon-refresh /></template>
            {{ t('requestDebug.replay.title') }}
          </a-button>
          <a-tooltip
            v-else-if="detail && !detail.truncated"
            :content="t('requestDebug.replay.pathNotAllowed')"
          >
            <a-button size="small" type="outline" disabled>
              {{ t('requestDebug.replay.title') }}
            </a-button>
          </a-tooltip>
        </div>
      </template>

      <a-spin :loading="loading" style="width: 100%">
        <div v-if="!loading && error" class="empty error-state">
          <icon-close-circle-fill />
          <span>{{ t('requestDebug.fetchFail') }}</span>
          <a-button size="small" type="text" @click="fetchDetail">
            <template #icon><icon-refresh /></template>
            {{ t('common.refresh') }}
          </a-button>
        </div>
        <div v-else-if="!loading && !detail" class="empty">{{ t('requestDebug.empty') }}</div>

        <a-tabs v-if="detail" default-active-key="raw" type="rounded">
          <a-tab-pane key="raw" :title="t('requestDebug.tabRaw')">
            <raw-tab :entry="detail" :model="model" />
          </a-tab-pane>
          <a-tab-pane key="upstream" :title="t('requestDebug.tabUpstream')">
            <upstream-tab :calls="detail.upstream_calls" />
          </a-tab-pane>
          <a-tab-pane
            v-if="userStore.isProOrAbove"
            key="analysis"
            :title="t('requestDebug.tabAnalysis')"
          >
            <analysis-tab :seq="detail.seq" />
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-card>

    <replay-modal v-model:visible="replayVisible" :seq="detail?.seq ?? 0" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { debugApi } from '@/api/debug'
import { useLoading } from '@/hooks/loading'
import { useUserStore } from '@/store'
import RawTab from './components/raw-tab.vue'
import UpstreamTab from './components/upstream-tab.vue'
import AnalysisTab from './components/analysis-tab.vue'
import ReplayModal from './components/replay-modal.vue'
import type { DebugEntryDetail } from '@/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const { loading, setLoading } = useLoading()

const detail = ref<DebugEntryDetail | null>(null)
// Distinguish a fetch failure from a genuinely empty result so the UI doesn't
// mask errors as "no data".
const error = ref(false)
// detail payload has no model field — carry it from the list row via query
const model = computed(() => (route.query.model as string) || '')

// Replay preconditions mirror the backend whitelist: only the two chat
// protocols, and the captured body must not be truncated.
const REPLAYABLE_PATHS = ['/v1/chat/completions', '/v1/messages']
const replayable = computed(
  () => !!detail.value && !detail.value.truncated && REPLAYABLE_PATHS.includes(detail.value.path),
)
const replayVisible = ref(false)

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return 'green'
  if (code >= 400 && code < 500) return 'orange'
  if (code >= 500) return 'red'
  return 'gray'
}

async function fetchDetail() {
  const seq = route.params.seq as string
  if (!seq) return
  setLoading(true)
  error.value = false
  try {
    const res = await debugApi.detail(seq)
    detail.value = res.data
  } catch {
    detail.value = null
    error.value = true
  } finally {
    setLoading(false)
  }
}

// Re-fetch whenever the :seq param changes — Vue Router reuses this component
// instance across navigations between detail entries, so a bare setup call would
// leave stale data when only the param differs.
watch(() => route.params.seq, fetchDetail, { immediate: true })
</script>

<style scoped lang="less">
.debug-detail-page {
  .header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .detail-id {
      font-family: var(--cl-font-mono);
      font-size: 13px;
      color: var(--color-text-1);
    }

    .detail-model {
      font-weight: 600;
      color: var(--color-text-1);
      font-size: 13px;
    }

    .detail-path {
      font-family: var(--cl-font-mono);
      font-size: 12px;
      color: var(--color-text-3);
    }
  }

  .empty {
    padding: 48px 0;
    text-align: center;
    color: var(--color-text-4);
  }

  .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: rgb(var(--red-6));

    :deep(svg) {
      font-size: 16px;
    }
  }
}
</style>

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
        </div>
      </template>

      <a-spin :loading="loading" style="width: 100%">
        <div v-if="!loading && !detail" class="empty">{{ t('requestDebug.empty') }}</div>

        <a-tabs v-if="detail" default-active-key="raw" type="rounded">
          <a-tab-pane key="raw" :title="t('requestDebug.tabRaw')">
            <raw-tab :entry="detail" :model="model" />
          </a-tab-pane>
          <a-tab-pane key="upstream" :title="t('requestDebug.tabUpstream')">
            <upstream-tab :calls="detail.upstream_calls" />
          </a-tab-pane>
          <a-tab-pane v-if="isProOrAbove" key="analysis" :title="t('requestDebug.tabAnalysis')">
            <analysis-tab :seq="detail.seq" />
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { debugApi } from '@/api/debug'
import { useLoading } from '@/hooks/loading'
import { useUserStore } from '@/store'
import RawTab from './components/raw-tab.vue'
import UpstreamTab from './components/upstream-tab.vue'
import AnalysisTab from './components/analysis-tab.vue'
import type { DebugEntryDetail } from '@/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const { loading, setLoading } = useLoading()

const detail = ref<DebugEntryDetail | null>(null)
// detail payload has no model field — carry it from the list row via query
const model = computed(() => (route.query.model as string) || '')
const isProOrAbove = computed(() => ['pro', 'enterprise'].includes(userStore.tier))

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
  try {
    const res = await debugApi.detail(seq)
    detail.value = res.data
  } catch {
    detail.value = null
  } finally {
    setLoading(false)
  }
}

fetchDetail()
</script>

<style scoped lang="less">
.debug-detail-page {
  .header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .detail-id {
      font-family: monospace;
      font-size: 13px;
      color: var(--color-text-1);
    }

    .detail-model {
      font-weight: 600;
      color: var(--color-text-1);
      font-size: 13px;
    }

    .detail-path {
      font-family: monospace;
      font-size: 12px;
      color: var(--color-text-3);
    }
  }

  .empty {
    padding: 48px 0;
    text-align: center;
    color: var(--color-text-4);
  }
}
</style>

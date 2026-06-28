<template>
  <div class="analysis-tab">
    <a-spin :loading="loading" style="width: 100%">
      <div v-if="!loading && !result" class="empty">{{ t('requestDebug.analysisFail') }}</div>

      <template v-if="result">
        <!-- parse warning -->
        <a-alert v-if="result.parse_error" type="warning" class="block">
          {{ t('requestDebug.parseError') }}: {{ result.parse_error }}
        </a-alert>

        <!-- usage overview -->
        <a-card v-if="result.usage || result.stop_reason" class="block" :bordered="false">
          <a-descriptions :column="4" size="small">
            <a-descriptions-item v-if="result.usage" :label="t('requestDebug.inputTokens')">
              {{ result.usage.input_tokens }}
            </a-descriptions-item>
            <a-descriptions-item v-if="result.usage" :label="t('requestDebug.outputTokens')">
              {{ result.usage.output_tokens }}
            </a-descriptions-item>
            <a-descriptions-item
              v-if="result.usage && result.usage.reasoning_tokens"
              :label="t('requestDebug.reasoningTokens')"
            >
              {{ result.usage.reasoning_tokens }}
            </a-descriptions-item>
            <a-descriptions-item
              v-if="result.usage && result.usage.estimated_cost_usd"
              :label="t('requestDebug.estCost')"
            >
              ${{ result.usage.estimated_cost_usd.toFixed(6) }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('requestDebug.stopReason')">
              {{ result.stop_reason || '-' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- tool summary -->
        <a-card v-if="result.tools && result.tools.total_calls > 0" class="block" :bordered="false">
          <template #title>
            <span class="section-title">
              {{ t('requestDebug.toolSummary') }}
              <a-tag size="small">{{ result.tools.success }}/{{ result.tools.total_calls }}</a-tag>
            </span>
          </template>
          <a-table
            :data="result.tools.by_tool"
            :pagination="false"
            size="small"
            :bordered="false"
            row-key="name"
          >
            <template #columns>
              <a-table-column :title="t('requestDebug.toolName')" data-index="name" />
              <a-table-column
                :title="t('requestDebug.toolCount')"
                data-index="count"
                align="center"
              />
              <a-table-column
                :title="t('requestDebug.toolSuccess')"
                data-index="success"
                align="center"
              />
              <a-table-column
                :title="t('requestDebug.toolFailed')"
                data-index="failed"
                align="center"
              />
            </template>
          </a-table>
        </a-card>

        <!-- timeline -->
        <a-card class="block" :bordered="false">
          <template #title>
            <span class="section-title">{{ t('requestDebug.timeline') }}</span>
          </template>
          <div v-if="!result.timeline.length" class="empty">{{ t('requestDebug.noTimeline') }}</div>
          <div
            v-for="(step, idx) in result.timeline"
            :key="idx"
            class="step"
            :class="`step-${step.role}`"
          >
            <div class="step-meta">
              <a-tag size="small" :color="roleColor(step.role)">{{ roleLabel(step.role) }}</a-tag>
              <a-tag size="small">{{ typeLabel(step.type) }}</a-tag>
            </div>
            <div class="step-body">
              <!-- text -->
              <div v-if="step.type === 'text' && step.detail?.text" class="step-text">
                {{ step.detail.text }}
              </div>
              <!-- thinking -->
              <div
                v-else-if="step.type === 'thinking' && step.detail?.thinking"
                class="step-thinking"
              >
                {{ step.detail.thinking }}
              </div>
              <!-- tool_use -->
              <div v-else-if="step.type === 'tool_use'" class="step-tool">
                <div class="step-tool-name">{{ step.detail?.tool_name }}</div>
                <pre v-if="rawText(step.detail?.tool_input)" class="content-block">{{
                  rawText(step.detail?.tool_input)
                }}</pre>
              </div>
              <!-- tool_result -->
              <div v-else-if="step.type === 'tool_result'" class="step-tool">
                <a-tag v-if="step.detail?.is_error" color="red" size="small">error</a-tag>
                <pre v-if="rawText(step.detail?.tool_output)" class="content-block">{{
                  rawText(step.detail?.tool_output)
                }}</pre>
              </div>
              <!-- image -->
              <div v-else-if="step.type === 'image'" class="step-images">
                <a
                  v-for="(img, i) in step.detail?.images || []"
                  :key="i"
                  :href="img.url"
                  target="_blank"
                  class="step-image-link"
                >
                  [{{ t('requestDebug.typeImage')
                  }}{{ img.media_type ? ` · ${img.media_type}` : '' }}]
                </a>
              </div>
              <!-- fallback summary -->
              <div v-else class="step-summary">{{ step.summary || '-' }}</div>
            </div>
          </div>
        </a-card>
      </template>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { debugApi } from '@/api/debug'
import { useLoading } from '@/hooks/loading'
import type { AnalysisResult } from '@/types'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const { loading, setLoading } = useLoading()

const result = ref<AnalysisResult | null>(null)

async function fetchAnalysis() {
  setLoading(true)
  try {
    const res = await debugApi.analysis(props.id)
    result.value = res.data
  } catch {
    result.value = null
  } finally {
    setLoading(false)
  }
}

watch(() => props.id, fetchAnalysis, { immediate: true })

function rawText(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function roleLabel(role: string): string {
  if (role === 'user') return t('requestDebug.roleUser')
  if (role === 'assistant') return t('requestDebug.roleAssistant')
  if (role === 'tool') return t('requestDebug.roleTool')
  return role
}

function roleColor(role: string): string {
  if (role === 'user') return 'arcoblue'
  if (role === 'assistant') return 'green'
  if (role === 'tool') return 'purple'
  return 'gray'
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    text: t('requestDebug.typeText'),
    thinking: t('requestDebug.typeThinking'),
    tool_use: t('requestDebug.typeToolUse'),
    tool_result: t('requestDebug.typeToolResult'),
    image: t('requestDebug.typeImage'),
  }
  return map[type] || type
}
</script>

<style scoped lang="less">
.analysis-tab {
  .block {
    margin-bottom: 16px;
  }

  .section-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .empty {
    padding: 24px 0;
    text-align: center;
    color: var(--color-text-4);
  }

  .step {
    padding: 10px 0;
    border-bottom: 1px solid var(--color-fill-2);

    &:last-child {
      border-bottom: none;
    }

    .step-meta {
      display: flex;
      gap: 6px;
      margin-bottom: 6px;
    }

    .step-text {
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--color-text-1);
      font-size: 13px;
      line-height: 1.6;
    }

    .step-thinking {
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--color-text-3);
      font-size: 12px;
      font-style: italic;
      padding-left: 10px;
      border-left: 2px solid var(--color-fill-3);
    }

    .step-tool-name {
      font-family: monospace;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-1);
      margin-bottom: 4px;
    }
  }

  .content-block {
    margin: 0;
    padding: 10px;
    background: var(--color-fill-2);
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 300px;
    overflow-y: auto;
  }
}
</style>

<template>
  <div class="message-item" :class="[`message-${message.role}`]">
    <div class="message-avatar">
      <div v-if="message.role === 'user'" class="avatar avatar-user">
        <icon-user />
      </div>
      <div v-else class="avatar avatar-assistant">
        <icon-robot />
      </div>
    </div>
    <div class="message-body">
      <div class="message-role">{{ roleLabel }}</div>

      <!-- Thinking / Reasoning section (collapsible) -->
      <div
        v-if="message.role === 'assistant' && effectiveReasoning"
        class="thinking-section"
        :class="{ 'is-thinking': inThinkingPhase }"
      >
        <div class="thinking-header" @click="thinkingExpanded = !thinkingExpanded">
          <icon-thunderbolt class="thinking-icon" :class="{ pulsing: inThinkingPhase }" />
          <span class="thinking-label">{{ thinkingLabel }}</span>
          <span class="thinking-toggle">
            {{ thinkingExpanded ? t('playground.hideThinking') : t('playground.showThinking') }}
          </span>
          <icon-down v-if="!thinkingExpanded" class="thinking-arrow" />
          <icon-up v-else class="thinking-arrow" />
        </div>
        <div
          v-if="thinkingExpanded"
          class="thinking-content markdown-body"
          @click="onCodeClick"
          v-html="renderedReasoning"
        />
        <span v-if="inThinkingPhase && thinkingExpanded" class="streaming-cursor" />
      </div>

      <!-- Main response content -->
      <div
        v-if="message.role === 'assistant'"
        class="markdown-body"
        @click="onCodeClick"
        v-html="renderedContent"
      />
      <div v-else class="message-text">{{ message.content }}</div>
      <span v-if="streaming && !inThinkingPhase" class="streaming-cursor" />

      <!-- Usage info below assistant message -->
      <div v-if="message.role === 'assistant' && usage && !streaming" class="message-usage">
        <span class="usage-tag">
          <icon-swap style="font-size: 12px" />
          {{ t('playground.tokensUsed', { input: usage.input, output: usage.output }) }}
        </span>
        <span v-if="usage.latency_ms" class="usage-tag">
          <icon-thunderbolt style="font-size: 12px" />
          {{ usage.latency_ms }}ms
        </span>
        <span v-if="usage.provider" class="usage-tag">
          <icon-storage style="font-size: 12px" />
          {{ usage.provider }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { copyToClipboard } from '@/utils/clipboard'
import { renderMarkdown } from '@/utils/render-markdown'
import { splitThinking } from '@/utils/parse-thinking'
import type { PlaygroundMessage } from '@/types'

const props = defineProps<{
  message: PlaygroundMessage
  usage?: { input: number; output: number; latency_ms?: number; provider?: string }
  streaming?: boolean
}>()

const { t } = useI18n()

const thinkingExpanded = ref(false)

// Pull <think>…</think> blocks out of inline content so reasoning models that
// embed chain-of-thought in `content` (DeepSeek-R1, QwQ, …) render it in the
// collapsible block instead of polluting the answer. Also honors the dedicated
// `reasoning_content` field — both sources are merged here at render time, so
// the stored message stays untouched and reversible.
const segments = computed(() => splitThinking(props.message.content || ''))
const effectiveReasoning = computed(() => {
  const field = (props.message.reasoning_content || '').trim()
  const inline = segments.value.reasoning
  if (field && inline) return `${field}\n${inline}`
  return field || inline
})
const effectiveContent = computed(() => segments.value.content)

const renderedReasoning = computed(() => renderMarkdown(effectiveReasoning.value, t('common.copy')))
const renderedContent = computed(() => renderMarkdown(effectiveContent.value, t('common.copy')))

// "Thinking phase" = reasoning is streaming in and the answer has not started
// yet. Drives the live timer and the pulsing indicator.
const inThinkingPhase = computed(
  () => !!props.streaming && !!effectiveReasoning.value && !effectiveContent.value.trim(),
)

const elapsedSec = ref(0)
let timerId: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}
function startTimer() {
  stopTimer()
  elapsedSec.value = 0
  timerId = setInterval(() => {
    elapsedSec.value += 1
  }, 1000)
}

watch(
  inThinkingPhase,
  (active) => {
    if (active) startTimer()
    else stopTimer()
  },
  { immediate: true },
)
onBeforeUnmount(stopTimer)

const thinkingLabel = computed(() => {
  if (inThinkingPhase.value) {
    return t('playground.thinkingFor', { s: elapsedSec.value })
  }
  if (elapsedSec.value > 0) {
    return t('playground.thoughtFor', { s: elapsedSec.value })
  }
  return t('playground.thinking')
})

// Expand as soon as reasoning appears mid-stream; collapse when the stream ends
// (default-collapsed after done — matches ChatGPT/DeepSeek).
watch(
  () => props.streaming,
  (isStreaming) => {
    if (!isStreaming) thinkingExpanded.value = false
  },
)
watch(
  () => effectiveReasoning.value,
  (reasoning) => {
    if (props.streaming && reasoning) thinkingExpanded.value = true
  },
)

const roleLabel = computed(() => {
  if (props.message.role === 'user') return t('playground.roleUser')
  if (props.message.role === 'assistant') return t('playground.roleAssistant')
  return t('playground.roleSystem')
})

// Event-delegated copy handler — replaces the former global window.__copyCode
function onCodeClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  const btn = target?.closest('.code-copy-btn') as HTMLButtonElement | null
  if (!btn) return
  const pre = btn.closest('.code-block')
  const code = pre?.querySelector('code')
  if (!code) return
  copyToClipboard(code.textContent || '')
    .then(() => {
      const original = btn.textContent
      btn.textContent = '✓'
      setTimeout(() => {
        btn.textContent = original
      }, 1500)
    })
    .catch(() => Message.error(t('common.copyFail')))
}
</script>

<style scoped lang="less">
.message-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;

  & + .message-item {
    border-top: 1px solid var(--color-border-1);
  }
}

.message-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.avatar-user {
  background: rgb(var(--arcoblue-1));
  color: rgb(var(--arcoblue-6));
}

.avatar-assistant {
  background: rgb(var(--arcogreen-1));
  color: rgb(var(--arcogreen-6));
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-role {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-2);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-1);
  white-space: pre-wrap;
  word-break: break-word;
}

.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: rgb(var(--arcoblue-6));
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}

// Thinking section
.thinking-section {
  margin-bottom: 8px;
  border: 1px solid var(--color-border-2);
  border-left: 3px solid rgb(var(--warning-6));
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-fill-1);

  &.is-thinking {
    border-left-color: rgb(var(--arcoblue-6));
  }
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  background: var(--color-fill-2);
  user-select: none;
  transition: background-color 0.2s;

  &:hover {
    background: var(--color-fill-3);
  }
}

.thinking-icon {
  font-size: 14px;
  color: rgb(var(--warning-6));

  &.pulsing {
    color: rgb(var(--arcoblue-6));
    animation: pulse 1.2s ease-in-out infinite;
  }
}

.thinking-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-2);
  flex: 1;
  font-variant-numeric: tabular-nums;
}

.thinking-toggle {
  font-size: 11px;
  color: var(--color-text-3);
}

.thinking-arrow {
  font-size: 12px;
  color: var(--color-text-3);
}

// Reasoning body — markdown rendered, but visually muted & smaller than the
// answer so the two stay distinct.
.thinking-content {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-3);
  background: var(--color-fill-1);
  border-top: 1px solid var(--color-border-1);
  max-height: 300px;
  overflow-y: auto;
}

.message-usage {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--color-border-1);
}

.usage-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--color-text-4);
  line-height: 1;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>

<style lang="less">
// Markdown body styles (unscoped for v-html content)
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-1);
  word-break: break-word;

  p {
    margin: 0 0 8px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 16px 0 8px;
    font-weight: 600;
    line-height: 1.4;
  }

  h1 {
    font-size: 1.5em;
  }
  h2 {
    font-size: 1.3em;
  }
  h3 {
    font-size: 1.15em;
  }

  ul,
  ol {
    margin: 4px 0;
    padding-left: 20px;
  }

  li {
    margin: 2px 0;
  }

  blockquote {
    margin: 8px 0;
    padding: 4px 12px;
    border-left: 3px solid rgb(var(--arcoblue-6));
    background: var(--color-fill-1);
    border-radius: 0 4px 4px 0;
    color: var(--color-text-2);
  }

  a {
    color: rgb(var(--arcoblue-6));
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  strong {
    font-weight: 600;
  }

  table {
    border-collapse: collapse;
    margin: 8px 0;
    width: 100%;
    th,
    td {
      border: 1px solid var(--color-border-2);
      padding: 6px 12px;
      text-align: left;
    }
    th {
      background: var(--color-fill-2);
      font-weight: 600;
    }
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border-2);
    margin: 12px 0;
  }

  .code-block {
    position: relative;
    margin: 8px 0;
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-fill-2);

    .code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 12px;
      background: var(--color-fill-3);
      border-bottom: 1px solid var(--color-border-1);
    }

    .code-lang {
      font-size: 11px;
      color: var(--color-text-3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .code-copy-btn {
      font-size: 11px;
      color: var(--color-text-2);
      background: none;
      border: 1px solid var(--color-border-2);
      border-radius: 4px;
      padding: 1px 8px;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        color: rgb(var(--arcoblue-6));
        border-color: rgb(var(--arcoblue-6));
      }
    }

    code.hljs {
      display: block;
      padding: 12px 16px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.6;
      background: transparent;
    }
  }

  code:not(.hljs) {
    background: var(--color-fill-2);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    color: rgb(var(--arcoblue-6));
  }
}
</style>

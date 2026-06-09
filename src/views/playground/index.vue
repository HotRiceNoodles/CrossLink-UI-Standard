<template>
  <div class="playground-page">
    <!-- Empty state: no models configured -->
    <div v-if="modelList.length === 0 && !modelsLoading" class="empty-state">
      <a-empty>
        <template #image>
          <icon-robot style="font-size: 48px; color: var(--color-text-4)" />
        </template>
        <template #description>
          <div class="empty-title">{{ t('playground.noModels') }}</div>
          <div class="empty-desc">{{ t('playground.noModelsDesc') }}</div>
        </template>
      </a-empty>
    </div>

    <!-- Main playground layout -->
    <div v-else class="playground-layout">
      <!-- Chat area -->
      <div class="chat-area">
        <!-- Messages -->
        <div ref="messagesContainer" class="messages-container">
          <div v-if="messages.length === 0" class="chat-empty">
            <div class="chat-empty-icon">
              <icon-message style="font-size: 32px; color: var(--color-text-4)" />
            </div>
            <div class="chat-empty-title">{{ t('playground.emptyChat') }}</div>
            <div class="chat-empty-desc">{{ t('playground.emptyChatDesc') }}</div>
          </div>
          <template v-else>
            <message-item
              v-for="(msg, idx) in messages"
              :key="idx"
              :message="msg"
              :usage="messageUsages[idx]"
              :streaming="streaming && idx === messages.length - 1 && msg.role === 'assistant'"
            />
          </template>
          <!-- Error message -->
          <div v-if="errorMessage" class="error-message">
            <icon-exclamation-circle style="font-size: 14px" />
            {{ errorMessage }}
          </div>
        </div>

        <!-- Input -->
        <chat-input
          :disabled="!selectedModel || modelList.length === 0"
          :streaming="streaming"
          :sending="sending"
          @send="handleSend"
          @stop="handleStop"
        />
      </div>

      <!-- Parameter panel -->
      <parameter-panel
        :model-list="modelList"
        :selected-model="selectedModel"
        :params="params"
        :use-streaming="useStreaming"
        :collapsed="panelCollapsed"
        :streaming="streaming || sending"
        @update:selected-model="selectedModel = $event"
        @update:use-streaming="useStreaming = $event"
        @update:collapsed="panelCollapsed = $event"
        @param-change="handleParamChange"
        @clear="handleClear"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { modelApi } from '@/api/model'
import { playgroundApi } from '@/api/playground'
import { usePlaygroundStream } from '@/composables/use-playground-stream'
import type { PlaygroundMessage, PlaygroundRequest, ProviderModel } from '@/types'
import MessageItem from './components/message-item.vue'
import ChatInput from './components/chat-input.vue'
import ParameterPanel from './components/parameter-panel.vue'

const { t } = useI18n()

// Models
const modelList = ref<ProviderModel[]>([])
const modelsLoading = ref(true)
const selectedModel = ref('')

// Messages
const messages = ref<PlaygroundMessage[]>([])
const sending = ref(false)
const errorMessage = ref('')

// Usage per message (keyed by message index)
const messageUsages = reactive<
  Record<number, { input: number; output: number; latency_ms?: number; provider?: string }>
>({})

// Parameters
const params = reactive({
  systemPrompt: '',
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
})
const useStreaming = ref(true)
const panelCollapsed = ref(false)

// SSE streaming
const {
  streaming,
  streamedContent,
  streamedReasoning,
  error: streamError,
  startStream,
  abort,
} = usePlaygroundStream()

// Scroll container ref
const messagesContainer = ref<HTMLElement>()

// Load models
onMounted(async () => {
  try {
    const res = await modelApi.list()
    modelList.value = res.data || []
    if (modelList.value.length > 0) {
      selectedModel.value = modelList.value[0].model_name
    }
  } catch {
    // Models API may fail silently; empty state is shown
  } finally {
    modelsLoading.value = false
  }
})

// Auto-scroll on new content
watch(streamedContent, () => {
  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  })
})

// Update live streaming content in the last assistant message
watch(streamedContent, (content) => {
  if (streaming.value && messages.value.length > 0) {
    const last = messages.value[messages.value.length - 1]
    if (last.role === 'assistant') {
      last.content = content
    }
  }
})

// Update live streaming reasoning content in the last assistant message
watch(streamedReasoning, (reasoning) => {
  if (streaming.value && messages.value.length > 0) {
    const last = messages.value[messages.value.length - 1]
    if (last.role === 'assistant') {
      last.reasoning_content = reasoning
    }
  }
})

// Build the API request payload
function buildRequest(): PlaygroundRequest {
  const msgs: PlaygroundMessage[] = []
  if (params.systemPrompt) {
    msgs.push({ role: 'system', content: params.systemPrompt })
  }
  msgs.push(...messages.value)
  return {
    model: selectedModel.value,
    messages: msgs.slice(-100), // Enforce 100-message limit
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    top_p: params.topP,
    stream: useStreaming.value,
  }
}

// Send a user message
async function handleSend(content: string) {
  errorMessage.value = ''

  // Append user message
  messages.value.push({ role: 'user', content })

  if (useStreaming.value) {
    await handleStreamSend()
  } else {
    await handleNonStreamSend()
  }
}

async function handleStreamSend() {
  // Build request FIRST (before adding the placeholder, so it's not sent to the backend)
  const request = buildRequest()

  // Append placeholder assistant message for UI display
  messages.value.push({ role: 'assistant', content: '' })

  try {
    const result = await startStream(request)
    const lastIdx = messages.value.length - 1
    // Finalize the last message
    messages.value[lastIdx].content = result.fullContent
    if (result.reasoningContent) {
      messages.value[lastIdx].reasoning_content = result.reasoningContent
    }
    if (result.usage) {
      messageUsages[lastIdx] = result.usage
    }

    if (result.aborted) {
      Message.info(t('playground.aborted'))
    }
  } catch {
    // Remove empty assistant message on error
    if (messages.value[messages.value.length - 1]?.content === '') {
      messages.value.pop()
    }
    errorMessage.value = streamError.value || t('playground.streamError')
  }
}

async function handleNonStreamSend() {
  sending.value = true
  try {
    const res = await playgroundApi.chat(buildRequest())
    const data = res.data
    // Extract content from OpenAI response
    const { content, reasoningContent } = extractContent(data.response)
    messages.value.push({ role: 'assistant', content, reasoning_content: reasoningContent })
    const lastIdx = messages.value.length - 1
    messageUsages[lastIdx] = {
      ...data.tokens,
      latency_ms: data.latency_ms,
      provider: data.provider,
    }
  } catch {
    errorMessage.value = t('playground.chatError')
  } finally {
    sending.value = false
  }
}

// Extract text content and reasoning content from an OpenAI-format response object
function extractContent(response: unknown): { content: string; reasoningContent?: string } {
  if (!response) return { content: '' }
  const resp = response as Record<string, unknown>
  const choices = resp.choices as Array<Record<string, unknown>> | undefined
  if (choices?.[0]?.message) {
    const msg = choices[0].message as Record<string, unknown>
    return {
      content: (msg.content as string) || '',
      reasoningContent: (msg.reasoning_content as string) || undefined,
    }
  }
  return { content: JSON.stringify(response) }
}

function handleStop() {
  abort()
}

function handleClear() {
  messages.value = []
  errorMessage.value = ''
  Object.keys(messageUsages).forEach((k) => delete messageUsages[Number(k)])
}

function handleParamChange(key: string, value: unknown) {
  if (key in params) {
    ;(params as Record<string, unknown>)[key] = value
  }
}
</script>

<style scoped lang="less">
.playground-page {
  height: calc(100vh - 96px); // navbar (56px) + padding (40px)
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-top: 8px;
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-3);
  margin-top: 4px;
}

.playground-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--color-bg-2);
  border-radius: 8px;
  border: 1px solid var(--color-border-1);
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-3);
}

.chat-empty-icon {
  margin-bottom: 12px;
}

.chat-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-2);
}

.chat-empty-desc {
  font-size: 13px;
  margin-top: 4px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin: 8px 0;
  background: rgb(var(--red-1));
  color: rgb(var(--red-6));
  border-radius: 6px;
  font-size: 13px;
}
</style>

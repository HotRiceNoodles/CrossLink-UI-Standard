import { ref, readonly } from 'vue'
import { playgroundApi } from '@/api/playground'
import type {
  PlaygroundRequest,
  PlaygroundStreamResult,
  PlaygroundUsage,
  SSEGuardrailEvent,
} from '@/types'

export function usePlaygroundStream() {
  const streaming = ref(false)
  const streamedContent = ref('')
  const streamedReasoning = ref('')
  const usage = ref<PlaygroundUsage | null>(null)
  const guardrails = ref<SSEGuardrailEvent[]>([])
  const error = ref<string | null>(null)

  let abortController: AbortController | null = null

  async function startStream(request: PlaygroundRequest): Promise<PlaygroundStreamResult> {
    // Reset state
    streaming.value = true
    streamedContent.value = ''
    streamedReasoning.value = ''
    usage.value = null
    guardrails.value = []
    error.value = null

    abortController = new AbortController()

    try {
      const response = await playgroundApi.stream(request, abortController.signal)

      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        throw new Error(errBody?.error || `HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue

          try {
            const event = JSON.parse(payload)

            if (event.type === 'usage') {
              usage.value = event.data
            } else if (event.type === 'guardrail_masked') {
              guardrails.value.push(event)
            } else if (event.choices?.[0]?.delta) {
              const delta = event.choices[0].delta
              // Regular content
              if (delta.content) {
                streamedContent.value += delta.content
              }
              // Thinking/reasoning content (separate stream)
              if (delta.reasoning_content) {
                streamedReasoning.value += delta.reasoning_content
              }
            }
          } catch {
            // Malformed JSON chunk — skip
          }
        }
      }

      return {
        fullContent: streamedContent.value,
        reasoningContent: streamedReasoning.value,
        usage: usage.value,
        aborted: false,
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return {
          fullContent: streamedContent.value,
          reasoningContent: streamedReasoning.value,
          usage: usage.value,
          aborted: true,
        }
      }
      const message = e instanceof Error ? e.message : 'Stream failed'
      error.value = message
      throw e
    } finally {
      streaming.value = false
      abortController = null
    }
  }

  function abort() {
    abortController?.abort()
  }

  return {
    streaming: readonly(streaming),
    streamedContent: readonly(streamedContent),
    streamedReasoning: readonly(streamedReasoning),
    usage: readonly(usage),
    guardrails: readonly(guardrails),
    error: readonly(error),
    startStream,
    abort,
  }
}

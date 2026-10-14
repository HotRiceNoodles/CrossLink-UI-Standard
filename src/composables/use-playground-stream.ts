import { ref, readonly } from 'vue'
import { playgroundApi } from '@/api/playground'
import { handleUnauthorized } from '@/api/interceptor'
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
        // The stream uses raw fetch (bypasses the axios interceptor), so handle
        // 401 explicitly to keep parity with the rest of the app.
        if (response.status === 401) {
          handleUnauthorized()
        }
        const errBody = await response.json().catch(() => null)
        // The playground error body carries `error` either as a message
        // string or as {type, message} (guardrail blocks) — extract the
        // human-readable message, never "[object Object]".
        const err = errBody?.error
        const message =
          typeof err === 'string' ? err : err?.message || err?.type || `HTTP ${response.status}`
        throw new Error(message)
      }

      if (!response.body) {
        throw new Error('Stream response has no body')
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      // SSE event name from the last `event:` line (null until one arrives);
      // the chat stream sends data-only frames, the responses path marks its
      // terminal errors with `event: error`.
      let currentEvent: string | null = null
      let streamErrorEvent: { type?: string; message: string } | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
            continue
          }
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue

          try {
            const event = JSON.parse(payload)

            // Terminal stream error. Guardrail blocks arrive either as
            // {error: {type: 'guardrail_blocked'|'guardrail_error', message}}
            // (data-only frames) or as an `event: error` frame whose payload
            // carries {type, message} directly.
            if (event.error) {
              const err = event.error as string | { type?: string; message?: string }
              streamErrorEvent = {
                type: typeof err === 'object' ? err.type : undefined,
                message: typeof err === 'string' ? err : err.message || 'stream error',
              }
              continue
            }
            if (currentEvent === 'error') {
              streamErrorEvent = {
                type: event.type,
                message: event.message || 'stream error',
              }
              continue
            }

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

      // A terminal error frame (e.g. guardrail block) ends the stream; report
      // it as a failure instead of returning the partial content as success.
      if (streamErrorEvent) {
        throw new Error(streamErrorEvent.message)
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

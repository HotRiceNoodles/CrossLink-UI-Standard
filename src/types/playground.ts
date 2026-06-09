/** Playground message in the conversation */
export interface PlaygroundMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  reasoning_content?: string
}

/** Request payload sent to the Playground chat API */
export interface PlaygroundRequest {
  model: string
  messages: PlaygroundMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
}

/** Token usage returned by the Playground API (uses shortened keys: input/output) */
export interface PlaygroundUsage {
  input: number
  output: number
  latency_ms?: number
  provider?: string
}

/** Non-streaming Playground response envelope */
export interface PlaygroundResponse {
  response: unknown
  model: string
  provider: string
  tokens: PlaygroundUsage
  latency_ms: number
}

/** SSE stream result accumulated by the composable */
export interface PlaygroundStreamResult {
  fullContent: string
  reasoningContent: string
  usage: PlaygroundUsage | null
  aborted: boolean
}

/** Guardrail masking event from SSE stream */
export interface SSEGuardrailEvent {
  type: 'guardrail_masked'
  content: string
}

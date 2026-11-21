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
  /** 容灾链执行记录（count>0 = 本次请求发生了路由切换） */
  fallback?: PlaygroundFallback
}

/** 容灾链单次尝试（服务端 FallbackEngine 执行记录） */
export interface PlaygroundFallbackAttempt {
  provider: string
  model: string
  success: boolean
  skipped?: boolean
  latency_ms?: number
  error_type?: string
  error?: string
  upstream_status?: number
  persistent?: boolean
}

export interface PlaygroundFallback {
  count: number
  attempts: PlaygroundFallbackAttempt[]
}

/** Non-streaming Playground response envelope */
export interface PlaygroundResponse {
  response: unknown
  model: string
  provider: string
  tokens: PlaygroundUsage
  latency_ms: number
  /** 容灾链执行记录（与 usage 事件同构） */
  fallback?: PlaygroundFallback
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

// --- Image Generation ---

/** Request payload for the Playground image generation API */
export interface PlaygroundImageRequest {
  model: string
  prompt: string
  n?: number
  size?: string
  quality?: string
}

/** Single image data from the image generation response */
export interface PlaygroundImageData {
  b64_json?: string
  url?: string
}

/** Response from the Playground image generation API */
export interface PlaygroundImageResponse {
  images: PlaygroundImageData[]
  model: string
  provider: string
  cost: number
}

/** A batch of generated images (stored in history) */
export interface ImageGenerationBatch {
  id: number
  prompt: string
  images: PlaygroundImageData[]
  model: string
  provider: string
  cost: number
}

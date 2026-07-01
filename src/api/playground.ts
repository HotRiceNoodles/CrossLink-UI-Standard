import { post } from './interceptor'
import { getToken } from '@/utils/auth'
import type {
  PlaygroundRequest,
  PlaygroundResponse,
  PlaygroundImageRequest,
  PlaygroundImageResponse,
} from '@/types'

export const playgroundApi = {
  /** Non-streaming chat completion */
  chat: (data: PlaygroundRequest) =>
    post<PlaygroundResponse>('/playground/chat', { ...data, stream: false }),

  /** Streaming chat completion — returns raw fetch Response for SSE parsing */
  stream: async (data: PlaygroundRequest, signal: AbortSignal): Promise<Response> => {
    const token = getToken()
    return fetch('/admin/api/playground/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ ...data, stream: true }),
      signal,
    })
  },

  /** Image generation */
  imageGenerate: (data: PlaygroundImageRequest) =>
    post<PlaygroundImageResponse>('/playground/image', data),
}

export interface ThinkingSegments {
  reasoning: string
  content: string
}

/**
 * Split raw assistant content into reasoning and answer.
 *
 * Some reasoning models (DeepSeek-R1, QwQ, …) deliver their chain-of-thought
 * inline in the `content` field wrapped in `<think>…</think>` tags rather than
 * in a dedicated `reasoning_content` field. This extracts those blocks so the
 * UI can render the thinking separately from the answer.
 *
 * Handles the streaming mid-flight case where `</think>` has not arrived yet:
 * everything after the opening tag is treated as in-progress reasoning.
 */
export function splitThinking(raw: string): ThinkingSegments {
  if (!raw) return { reasoning: '', content: raw ?? '' }

  // `(?:<\/think>|$)` lets an unclosed `<think>` (stream still in flight) fall
  // through to end-of-string, so the tail is captured as reasoning.
  const thinkRe = /<think>([\s\S]*?)(?:<\/think>|$)/gi
  const parts: string[] = []

  const content = raw.replace(thinkRe, (_m, body: string) => {
    parts.push(body)
    return ''
  })

  // Strip a single leading newline left behind by a closing </think> tag so the
  // answer does not start with a blank line.
  const reasoning = parts.join('\n').trim()
  return { reasoning, content: content.replace(/^\r?\n/, '') }
}

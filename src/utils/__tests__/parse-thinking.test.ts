import { describe, it, expect } from 'vitest'
import { splitThinking } from '../parse-thinking'

describe('splitThinking', () => {
  it('extracts a closed <think> block and leaves the answer as content', () => {
    const out = splitThinking('<think>let me consider</think>final answer')
    expect(out.reasoning).toBe('let me consider')
    expect(out.content).toBe('final answer')
  })

  it('treats an unclosed <think> as in-progress reasoning (streaming mid-flight)', () => {
    // No </think> yet — everything after the opening tag is reasoning, content empty.
    const out = splitThinking('<think>reasoning so far')
    expect(out.reasoning).toBe('reasoning so far')
    expect(out.content).toBe('')
  })

  it('handles multiple <think> blocks, concatenating reasoning and interleaved content', () => {
    const out = splitThinking('<think>r1</think>c1<think>r2</think>c2')
    expect(out.reasoning).toBe('r1\nr2')
    expect(out.content).toBe('c1c2')
  })

  it('returns content unchanged when there is no <think> tag', () => {
    const out = splitThinking('just a normal answer')
    expect(out.reasoning).toBe('')
    expect(out.content).toBe('just a normal answer')
  })

  it('strips a single leading newline left after the closing tag', () => {
    const out = splitThinking('<think>reasoning</think>\nanswer')
    expect(out.content).toBe('answer')
  })

  it('is case-insensitive about the tag', () => {
    const out = splitThinking('<THINK>reasoning</THINK>answer')
    expect(out.reasoning).toBe('reasoning')
    expect(out.content).toBe('answer')
  })

  it('preserves multi-line reasoning body', () => {
    const out = splitThinking('<think>line one\nline two\n- a bullet</think>\nanswer')
    expect(out.reasoning).toBe('line one\nline two\n- a bullet')
    expect(out.content).toBe('answer')
  })

  it('handles empty / null-ish input', () => {
    expect(splitThinking('')).toEqual({ reasoning: '', content: '' })
  })
})

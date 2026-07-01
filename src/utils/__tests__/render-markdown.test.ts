import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../render-markdown'

// These tests exercise the REAL playground markdown pipeline (markdown-it +
// DOMPurify + highlight.js) — the same function message-item.vue binds to
// v-html. They guard the stored-XSS fix against regressions.

function dangers(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return {
    handlers: doc.querySelectorAll('[onclick],[onerror],[onload],[onmouseover],[onfocus]').length,
    jsLinks: doc.querySelectorAll('a[href^="javascript:"],a[href^="vbscript:"]').length,
    scripts: doc.querySelectorAll('script').length,
    iframes: doc.querySelectorAll('iframe').length,
  }
}

const render = (content: string) => renderMarkdown(content, 'copy')

describe('renderMarkdown — XSS hardening', () => {
  it('neutralizes <img onerror> injected via fence info-string (lang)', () => {
    const out = render('```"><img src=x onerror=alert(1)>\nx = 1\n```')
    expect(dangers(out).handlers).toBe(0)
  })

  it('neutralizes javascript: scheme in markdown links', () => {
    const out = render('[click](javascript:alert(1))')
    // validateLink rejects it as a real href; the string may survive as inert
    // text, but there must be no executable <a href="javascript:..."> element.
    expect(dangers(out).jsLinks).toBe(0)
    expect(out).not.toMatch(/<a\s[^>]*href=["']?javascript:/i)
  })

  it('neutralizes data:text/html script links', () => {
    const out = render('[x](data:text/html,<script>alert(1)</script>)')
    expect(dangers(out).scripts).toBe(0)
    expect(dangers(out).jsLinks).toBe(0)
  })

  it('leaves no executable inline handler from raw HTML', () => {
    // html:false escapes raw HTML to text; DOMPurify is the backstop.
    const out = render('<a href="https://ok.com" onclick="alert(1)">x</a>')
    expect(dangers(out).handlers).toBe(0)
  })

  it('strips <script> and <iframe> entirely', () => {
    const out = render('<script>alert(1)</script><iframe src="https://evil"></iframe>')
    expect(dangers(out).scripts).toBe(0)
    expect(dangers(out).iframes).toBe(0)
  })
})

describe('renderMarkdown — legitimate output preserved', () => {
  it('renders fenced code with highlight + a class-based copy button (no inline handler)', () => {
    const out = render('```javascript\nconst a = 1\n```')
    expect(out).toContain('code-copy-btn')
    expect(out).toContain('hljs')
    expect(out).toContain('code-lang') // named-language branch shows the lang label
    expect(dangers(out).handlers).toBe(0) // copy button must not carry an onclick
  })

  it('uses the caller-supplied copy label', () => {
    expect(renderMarkdown('```\nx\n```', 'Копировать')).toContain('Копировать')
  })

  it('preserves safe http(s) links', () => {
    const out = render('[google](https://google.com)')
    expect(out).toContain('href="https://google.com"')
    expect(dangers(out).jsLinks).toBe(0)
  })

  it('preserves safe relative/internal links', () => {
    expect(render('[go](/dashboard)')).toContain('href="/dashboard"')
  })

  it('returns sanitized HTML for empty input', () => {
    expect(render('')).not.toContain('<script')
  })
})

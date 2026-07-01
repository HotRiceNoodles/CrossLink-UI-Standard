import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import bash from 'highlight.js/lib/languages/bash'
import shell from 'highlight.js/lib/languages/shell'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import sql from 'highlight.js/lib/languages/sql'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import plaintext from 'highlight.js/lib/languages/plaintext'
import 'highlight.js/styles/github-dark.css'

// On-demand language registration (avoids pulling highlight.js' full ~1MB bundle).
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('java', java)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('php', php)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('plaintext', plaintext)
hljs.registerLanguage('text', plaintext)

// Per-render copy-button label (i18n). Set before each md.render() call below.
let copyButtonLabel = 'copy'

const md = new MarkdownIt({
  highlight(str: string, lang: string) {
    // lang comes from the untrusted fence info-string — escape before interpolation.
    const safeLang = md.utils.escapeHtml(lang)
    const copyBtn = `<button class="code-copy-btn" type="button">${copyButtonLabel}</button>`
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="code-block"><div class="code-header"><span class="code-lang">${safeLang}</span>${copyBtn}</div><code class="hljs">${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch {
        // fall through to auto-detect
      }
    }
    return `<pre class="code-block"><div class="code-header">${copyBtn}</div><code class="hljs">${hljs.highlightAuto(str).value}</code></pre>`
  },
  html: false,
  linkify: true,
  breaks: true,
})

// Reject dangerous URL schemes in markdown links/images (defense-in-depth;
// DOMPurify strips them too).
const SAFE_LINK_RE = /^(https?:|mailto:|tel:|data:image\/|\/|\.\/|\.\.\/|#)/i
md.validateLink = (url: string) => SAFE_LINK_RE.test(url.trim())

/**
 * Render untrusted markdown to sanitized HTML, safe to bind via v-html.
 *
 * `copyLabel` is the text shown on each fenced code block's copy button
 * (i18n-driven by the caller). Output is run through DOMPurify so it carries
 * no inline event handlers, no <script>, and no javascript:/vbscript: URLs.
 */
export function renderMarkdown(content: string, copyLabel: string): string {
  copyButtonLabel = copyLabel
  return DOMPurify.sanitize(md.render(content || ''), {
    USE_PROFILES: { html: true },
    // rendered code-blocks use class-based copy buttons (no inline handlers);
    // keep class/style attributes DOMPurify would otherwise strip.
    ADD_ATTR: ['target'],
  })
}

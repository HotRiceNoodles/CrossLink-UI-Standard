/**
 * URL scheme allowlist — prevents `javascript:` / `vbscript:` / `data:text/html`
 * payloads from executing when an untrusted URL is bound to `href`/`src` or
 * passed to `window.open`. Returns '' for anything that is not an absolute
 * http(s)/mailto/tel URL or a `data:image/*` payload.
 */
const SAFE_URL_RE = /^(https?:|mailto:|tel:|data:image\/)/i

export function safeUrl(url: string | undefined | null): string {
  if (!url) return ''
  const trimmed = url.trim()
  return SAFE_URL_RE.test(trimmed) ? trimmed : ''
}

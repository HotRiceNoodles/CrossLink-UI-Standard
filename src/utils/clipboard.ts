/**
 * Copy text to clipboard with fallback for non-HTTPS environments.
 *
 * Priority:
 * 1. navigator.clipboard.writeText (modern API, requires HTTPS/localhost)
 * 2. textarea + execCommand('copy') (synchronous, preserves user gesture)
 */
export function copyToClipboard(text: string): Promise<void> {
  // Try modern Clipboard API (only in secure contexts)
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  }

  // Fallback: textarea + execCommand (works in HTTP)
  return fallbackCopy(text)
}

function fallbackCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    // Prevent mobile keyboard from showing
    textarea.setAttribute('readonly', '')
    // Make invisible but still functional
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    // iOS Safari needs setSelectionRange, not select()
    textarea.setSelectionRange(0, textarea.value.length)

    let success = false
    try {
      success = document.execCommand('copy')
    } catch {
      // ignore
    }
    document.body.removeChild(textarea)

    if (success) {
      resolve()
    } else {
      reject(new Error('Copy failed'))
    }
  })
}

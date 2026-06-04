/**
 * Copy text to clipboard with fallback for non-HTTPS environments.
 *
 * Priority:
 * 1. navigator.clipboard.writeText + readback verify (secure context)
 * 2. textarea + execCommand('copy') + readback verify (any context)
 */

export function copyToClipboard(text: string): Promise<void> {
  // Try modern Clipboard API (only in secure contexts)
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => verifyClipboard(text))
      .catch(() => fallbackCopy(text))
  }

  // Fallback: textarea + execCommand (works in HTTP)
  return fallbackCopy(text)
}

/**
 * Verify the clipboard actually contains what we just wrote.
 * Only works in secure context (HTTPS / localhost).
 */
async function verifyClipboard(expected: string): Promise<void> {
  try {
    const reading = await navigator.clipboard.readText()
    if (reading === expected) return
  } catch {
    // readText may be blocked by permissions — trust writeText if it resolved
    return
  }
  // readText succeeded but content doesn't match — real failure
  throw new Error('Clipboard verification failed')
}

function fallbackCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    // Prevent mobile keyboard from showing
    textarea.setAttribute('readonly', '')
    // Position off-screen but keep fully visible to the browser engine
    // (opacity:0 or display:none causes some browsers to skip the actual copy)
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    textarea.style.width = '2em'
    textarea.style.height = '2em'
    textarea.style.padding = '0'
    textarea.style.border = 'none'
    textarea.style.outline = 'none'
    textarea.style.boxShadow = 'none'
    textarea.style.background = 'transparent'
    document.body.appendChild(textarea)

    // Ensure focus and selection
    textarea.focus()
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

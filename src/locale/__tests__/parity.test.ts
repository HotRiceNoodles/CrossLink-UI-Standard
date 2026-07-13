import zhCN from '../zh-CN'
import enUS from '../en-US'
import arEG from '../ar-EG'

/** Recursively collect dotted key paths from a nested message object. */
function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return []
  const out: string[] = []
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...collectKeys(v, path))
    } else {
      out.push(path)
    }
  }
  return out
}

describe('locale key parity', () => {
  const zhKeys = new Set(collectKeys(zhCN))
  const enKeys = new Set(collectKeys(enUS))
  const arKeys = new Set(collectKeys(arEG))

  it('zh-CN matches en-US', () => {
    expect([...zhKeys].filter((k) => !enKeys.has(k))).toEqual([])
    expect([...enKeys].filter((k) => !zhKeys.has(k))).toEqual([])
  })

  it('ar-EG matches en-US', () => {
    const missingFromAr = [...enKeys].filter((k) => !arKeys.has(k))
    const extraInAr = [...arKeys].filter((k) => !enKeys.has(k))
    expect({ missingFromAr, extraInAr }).toEqual({ missingFromAr: [], extraInAr: [] })
  })
})

import { formatTime } from '../format'

describe('formatTime', () => {
  it('returns - for empty string', () => {
    expect(formatTime('')).toBe('-')
  })

  it('returns - for 0', () => {
    expect(formatTime(0)).toBe('-')
  })

  it('formats ISO date string with default format', () => {
    const result = formatTime('2025-01-15T10:30:00Z')
    expect(result).toMatch(/2025-01-15/)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('formats Date object', () => {
    const result = formatTime(new Date('2025-06-01T00:00:00Z'))
    expect(result).toMatch(/2025-06-01/)
  })

  it('accepts custom format', () => {
    const result = formatTime('2025-01-15', 'YYYY/MM/DD')
    expect(result).toBe('2025/01/15')
  })
})

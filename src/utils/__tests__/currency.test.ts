import { getCurrencySymbol } from '../currency'

describe('getCurrencySymbol', () => {
  it('returns ¥ for undefined', () => {
    expect(getCurrencySymbol()).toBe('¥')
  })

  it('returns ¥ for null', () => {
    expect(getCurrencySymbol(null)).toBe('¥')
  })

  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })

  it('returns € for EUR', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
  })

  it('returns £ for GBP', () => {
    expect(getCurrencySymbol('GBP')).toBe('£')
  })

  it('returns ¥ for JPY', () => {
    expect(getCurrencySymbol('JPY')).toBe('¥')
  })

  it('returns ¥ for CNY', () => {
    expect(getCurrencySymbol('CNY')).toBe('¥')
  })

  it('returns raw value for unknown currency', () => {
    expect(getCurrencySymbol('KRW')).toBe('KRW')
  })

  it('handles case-insensitive input', () => {
    expect(getCurrencySymbol('usd')).toBe('$')
  })
})

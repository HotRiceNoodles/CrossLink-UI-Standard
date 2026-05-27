const SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
}

export function getCurrencySymbol(currency?: string | null): string {
  if (!currency) return '¥'
  return SYMBOLS[currency.toUpperCase()] ?? currency
}

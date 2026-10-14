/**
 * Shared categorical palette + stable name→color hashing.
 *
 * One palette for every hash-colored element — chart series, provider/org
 * avatars, Top-N badges — so the same name renders in the same color
 * wherever it appears. First entry is the brand primary (#1D4ED8).
 *
 * Note: ECharts / inline styles need concrete hex values, not CSS vars.
 */
export const CATEGORICAL_PALETTE = [
  '#1D4ED8',
  '#00B42A',
  '#FF7D00',
  '#722ED1',
  '#F53F3F',
  '#0FC6C2',
  '#3491FA',
  '#F77234',
  '#D91AD9',
  '#4CDF48',
] as const

export function colorFromName(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0
  }
  return CATEGORICAL_PALETTE[Math.abs(h) % CATEGORICAL_PALETTE.length]
}

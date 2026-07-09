/**
 * Shared model color palette + stable name→color mapping.
 *
 * Color is derived from the model *name* (not list position) so a given model
 * renders in the same color across every dashboard widget — pie slices,
 * top-N badges, and bars — even when the widgets sort or slice the data
 * differently.
 */
export const MODEL_COLORS = [
  '#165DFF',
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

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function modelColor(name: string): string {
  return MODEL_COLORS[hashName(name) % MODEL_COLORS.length]
}

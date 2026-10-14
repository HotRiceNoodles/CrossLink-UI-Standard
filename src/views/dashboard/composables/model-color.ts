/**
 * Stable model name→color mapping for dashboard widgets.
 * Delegates to the shared categorical palette (src/utils/palette.ts) so
 * models, providers and orgs all color from the same swatch.
 */
export { CATEGORICAL_PALETTE as MODEL_COLORS, colorFromName as modelColor } from '@/utils/palette'

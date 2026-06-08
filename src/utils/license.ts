import { useI18n } from 'vue-i18n'

export function useTierLabel() {
  const { t } = useI18n()
  return (tier: string) => {
    const key = (tier || 'community').toLowerCase()
    const map: Record<string, string> = {
      community: t('tier.community'),
      pro: t('tier.pro'),
      enterprise: t('tier.enterprise'),
    }
    return map[key] || t('tier.community')
  }
}

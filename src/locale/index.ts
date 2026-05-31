import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

const LOCALE_KEY = 'locale'

function getStoredLocale(): string {
  return localStorage.getItem(LOCALE_KEY) || 'en-US'
}

const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export function changeLanguage(lang: string) {
  ;(i18n.global.locale as any).value = lang
  localStorage.setItem(LOCALE_KEY, lang)
  document.documentElement.lang = lang === 'en-US' ? 'en' : 'zh-CN'
}

export function getCurrentLocale(): string {
  return (i18n.global.locale as any).value
}

export default i18n

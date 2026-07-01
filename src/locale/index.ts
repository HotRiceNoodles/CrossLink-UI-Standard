import { createI18n } from 'vue-i18n'
import type { WritableComputedRef } from 'vue'
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

// In non-legacy mode the locale is a writable computed ref, but vue-i18n's
// types widen it to a union — narrow once at the module boundary.
const localeRef = i18n.global.locale as unknown as WritableComputedRef<string>

export function changeLanguage(lang: string) {
  localeRef.value = lang
  localStorage.setItem(LOCALE_KEY, lang)
  document.documentElement.lang = lang === 'en-US' ? 'en' : 'zh-CN'
}

export function getCurrentLocale(): string {
  return localeRef.value
}

export default i18n

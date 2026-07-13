import { createI18n } from 'vue-i18n'
import type { WritableComputedRef } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ar'
import zhCN from './zh-CN'
import enUS from './en-US'
import arEG from './ar-EG'

const LOCALE_KEY = 'locale'

/** Per-locale metadata: HTML lang tag, dayjs locale name, and text direction. */
const LOCALES = {
  'zh-CN': { htmlLang: 'zh-CN', dayjs: 'zh-cn', dir: 'ltr' },
  'en-US': { htmlLang: 'en', dayjs: 'en', dir: 'ltr' },
  'ar-EG': { htmlLang: 'ar', dayjs: 'ar', dir: 'rtl' },
} as const

export type AppLocale = keyof typeof LOCALES

function getStoredLocale(): AppLocale {
  const stored = localStorage.getItem(LOCALE_KEY)
  return stored in LOCALES ? (stored as AppLocale) : 'en-US'
}

const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ar-EG': arEG,
  },
})

// Apply the stored locale's dayjs + document direction on boot so a reload
// never shows mixed-language dates or the wrong text direction.
function applyDocumentLocale(lang: AppLocale) {
  const meta = LOCALES[lang]
  document.documentElement.lang = meta.htmlLang
  document.documentElement.dir = meta.dir
  dayjs.locale(meta.dayjs)
}
applyDocumentLocale(getStoredLocale())

// In non-legacy mode the locale is a writable computed ref, but vue-i18n's
// types widen it to a union — narrow once at the module boundary.
const localeRef = i18n.global.locale as unknown as WritableComputedRef<string>

export function changeLanguage(lang: string) {
  const next = lang in LOCALES ? (lang as AppLocale) : 'en-US'
  localeRef.value = next
  localStorage.setItem(LOCALE_KEY, next)
  applyDocumentLocale(next)
}

export function getCurrentLocale(): string {
  return localeRef.value
}

export function isRTL(lang: string): boolean {
  return lang in LOCALES ? LOCALES[lang as AppLocale].dir === 'rtl' : false
}

export const availableLocales: { value: AppLocale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ar-EG', label: 'العربية' },
]

export default i18n

import dayjs from 'dayjs'
import { changeLanguage } from '../index'

describe('changeLanguage switches dayjs locale', () => {
  afterEach(() => {
    // Restore default so test order never leaks into other suites.
    dayjs.locale('en')
    localStorage.removeItem('locale')
  })

  it('sets dayjs to zh-cn when language is zh-CN', () => {
    changeLanguage('zh-CN')
    expect(dayjs.locale()).toBe('zh-cn')
  })

  it('sets dayjs to en when language is en-US', () => {
    changeLanguage('en-US')
    expect(dayjs.locale()).toBe('en')
  })

  it('sets dayjs to ar when language is ar-EG', () => {
    changeLanguage('ar-EG')
    expect(dayjs.locale()).toBe('ar')
  })

  it('sets document direction to rtl for Arabic and ltr otherwise', () => {
    changeLanguage('ar-EG')
    expect(document.documentElement.dir).toBe('rtl')
    changeLanguage('en-US')
    expect(document.documentElement.dir).toBe('ltr')
    changeLanguage('zh-CN')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('renders a weekday in the active language', () => {
    // A fresh dayjs(value) is what production code (formatTime) builds at call
    // time, so it picks up the global locale — unlike an instance captured earlier.
    changeLanguage('zh-CN')
    expect(dayjs('2025-01-13T00:00:00Z').format('dddd')).toBe('星期一')
    changeLanguage('en-US')
    expect(dayjs('2025-01-13T00:00:00Z').format('dddd')).toBe('Monday')
  })
})

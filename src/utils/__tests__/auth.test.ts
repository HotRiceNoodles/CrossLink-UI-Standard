import { getToken, setToken, clearToken, isLogin } from '../auth'

describe('auth utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('getToken returns empty string when no token', () => {
    expect(getToken()).toBe('')
  })

  it('setToken stores and getToken retrieves', () => {
    setToken('test-token-123')
    expect(getToken()).toBe('test-token-123')
  })

  it('clearToken removes token', () => {
    setToken('test-token')
    clearToken()
    expect(getToken()).toBe('')
  })

  it('isLogin returns false without token', () => {
    expect(isLogin()).toBe(false)
  })

  it('isLogin returns true with token', () => {
    setToken('abc')
    expect(isLogin()).toBe(true)
  })
})

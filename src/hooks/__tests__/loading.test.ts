import { useLoading } from '../loading'

describe('useLoading', () => {
  it('defaults to false', () => {
    const { loading } = useLoading()
    expect(loading.value).toBe(false)
  })

  it('respects initial value', () => {
    const { loading } = useLoading(true)
    expect(loading.value).toBe(true)
  })

  it('setLoading updates value', () => {
    const { loading, setLoading } = useLoading()
    setLoading(true)
    expect(loading.value).toBe(true)
    setLoading(false)
    expect(loading.value).toBe(false)
  })

  it('toggle flips value', () => {
    const { loading, toggle } = useLoading()
    toggle()
    expect(loading.value).toBe(true)
    toggle()
    expect(loading.value).toBe(false)
  })
})

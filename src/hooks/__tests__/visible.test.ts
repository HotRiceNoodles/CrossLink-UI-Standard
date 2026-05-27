import { useVisible } from '../visible'

describe('useVisible', () => {
  it('defaults to false', () => {
    const { visible } = useVisible()
    expect(visible.value).toBe(false)
  })

  it('respects initial value', () => {
    const { visible } = useVisible(true)
    expect(visible.value).toBe(true)
  })

  it('show sets to true', () => {
    const { visible, show } = useVisible()
    show()
    expect(visible.value).toBe(true)
  })

  it('hide sets to false', () => {
    const { visible, hide } = useVisible(true)
    hide()
    expect(visible.value).toBe(false)
  })

  it('toggle flips value', () => {
    const { visible, toggle } = useVisible()
    toggle()
    expect(visible.value).toBe(true)
    toggle()
    expect(visible.value).toBe(false)
  })
})

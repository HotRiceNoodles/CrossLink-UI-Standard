import { ref } from 'vue'

export function useVisible(defaultValue = false) {
  const visible = ref(defaultValue)
  const show = () => {
    visible.value = true
  }
  const hide = () => {
    visible.value = false
  }
  const toggle = () => {
    visible.value = !visible.value
  }
  return { visible, show, hide, toggle }
}

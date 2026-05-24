import { ref } from 'vue'

export function useLoading(defaultValue = false) {
  const loading = ref(defaultValue)
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  const toggle = () => {
    loading.value = !loading.value
  }
  return { loading, setLoading, toggle }
}

import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { useLoading } from '@/hooks/loading'
import { useVisible } from '@/hooks/visible'

interface CrudOptions<T, F extends Record<string, unknown> = Record<string, unknown>> {
  fetchApi: () => Promise<{ data: T[] }>
  createApi?: (data: Partial<T>) => Promise<{ data: Record<string, unknown> }>
  updateApi?: (id: number | string, data: Partial<T>) => Promise<unknown>
  deleteApi?: (id: number | string) => Promise<unknown>
  filterFn?: (item: T, filter: F) => boolean
  defaultForm?: () => Partial<T>
  createSuccessMsg?: string
  updateSuccessMsg?: string
  deleteSuccessMsg?: string
  fetchErrorMsg?: string
  deleteErrorMsg?: string
  idField?: keyof T & string
}

export function useCrud<
  T extends Record<string, unknown>,
  F extends Record<string, unknown> = Record<string, unknown>,
>(options: CrudOptions<T, F>) {
  const { t } = useI18n()
  const { loading, setLoading } = useLoading()
  const { visible: drawerVisible, show: showDrawer, hide: hideDrawer } = useVisible()

  const list = ref<T[]>([]) as { value: T[] }
  const isEdit = ref(false)
  const editingId = ref<number | string>()
  const submitLoading = ref(false)
  const formRef = ref()

  const idField = options.idField ?? 'id'

  // Filter
  const filter = reactive<F>({} as F)
  const appliedFilter = reactive<F>({} as F)

  const filteredList = computed(() => {
    if (!options.filterFn) return list.value
    return list.value.filter((item) => options.filterFn!(item, { ...appliedFilter } as F))
  })

  // Pagination (client-side)
  const pagination = reactive({
    current: 1,
    pageSize: 20,
    showTotal: true,
    showPageSize: true,
  })

  function onPageChange(page: number) {
    pagination.current = page
  }

  function onPageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.current = 1
  }

  // Form
  const formData = reactive<Partial<T>>(options.defaultForm ? options.defaultForm() : {})

  function resetForm() {
    const defaults = options.defaultForm ? options.defaultForm() : {}
    Object.keys(formData).forEach((key) => delete (formData as Record<string, unknown>)[key])
    Object.assign(formData, defaults)
  }

  // Fetch
  async function fetchData() {
    setLoading(true)
    try {
      const res = await options.fetchApi()
      list.value = res.data
    } catch {
      Message.error(options.fetchErrorMsg || t('common.operationFail'))
    } finally {
      setLoading(false)
    }
  }

  function applyFilter() {
    Object.assign(appliedFilter, { ...filter })
    pagination.current = 1
  }

  function resetFilter() {
    Object.keys(filter).forEach((key) => delete (filter as Record<string, unknown>)[key])
    Object.keys(appliedFilter).forEach(
      (key) => delete (appliedFilter as Record<string, unknown>)[key],
    )
    pagination.current = 1
  }

  // CRUD
  function handleCreate() {
    isEdit.value = false
    editingId.value = undefined
    resetForm()
    showDrawer()
  }

  function handleEdit(record: T) {
    isEdit.value = true
    editingId.value = record[idField] as number | string
    resetForm()
    Object.assign(formData, { ...record })
    showDrawer()
  }

  function handleDrawerClose() {
    hideDrawer()
    formRef.value?.resetFields()
  }

  async function handleDrawerSubmit(extra?: Partial<T>) {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }

    submitLoading.value = true
    try {
      const payload = { ...formData, ...extra }
      if (isEdit.value && editingId.value !== undefined && options.updateApi) {
        await options.updateApi(editingId.value, payload)
        Message.success(options.updateSuccessMsg || t('common.updateSuccess'))
      } else if (options.createApi) {
        const res = await options.createApi(payload)
        hideDrawer()
        await fetchData()
        return res.data
      }
      hideDrawer()
      await fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      Message.error(error.response?.data?.error || t('common.operationFail'))
    } finally {
      submitLoading.value = false
    }
    return undefined
  }

  async function handleDelete(record: T) {
    const id = record[idField] as number | string
    try {
      await options.deleteApi?.(id)
      Message.success(options.deleteSuccessMsg || t('common.deleteSuccess'))
      await fetchData()
    } catch {
      Message.error(options.deleteErrorMsg || t('common.deleteFail'))
    }
  }

  return {
    // State
    loading,
    list,
    filteredList,
    drawerVisible,
    isEdit,
    editingId,
    submitLoading,
    formRef,
    formData,
    filter,
    appliedFilter,
    pagination,

    // Methods
    fetchData,
    applyFilter,
    resetFilter,
    handleCreate,
    handleEdit,
    handleDrawerClose,
    handleDrawerSubmit,
    handleDelete,
    resetForm,
    onPageChange,
    onPageSizeChange,
    showDrawer,
    hideDrawer,
  }
}

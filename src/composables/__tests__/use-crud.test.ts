import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCrud } from '../use-crud'

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// Mock @arco-design/web-vue Message
vi.mock('@arco-design/web-vue', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useLoading
vi.mock('@/hooks/loading', () => ({
  useLoading: () => ({
    loading: { value: false },
    setLoading: vi.fn(),
  }),
}))

// Mock useVisible
vi.mock('@/hooks/visible', () => ({
  useVisible: () => ({
    visible: { value: false },
    show: vi.fn(),
    hide: vi.fn(),
  }),
}))

interface TestItem {
  id: number
  name: string
  status?: string
}

describe('useCrud', () => {
  const mockData: TestItem[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3', status: 'active' },
  ]

  const fetchApi = vi.fn().mockResolvedValue({ data: mockData })
  const createApi = vi.fn().mockResolvedValue({ data: { id: 4 } })
  const updateApi = vi.fn().mockResolvedValue({})
  const deleteApi = vi.fn().mockResolvedValue({})

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createCrud() {
    return useCrud<TestItem, Record<string, unknown>>({
      fetchApi,
      createApi,
      updateApi,
      deleteApi,
      defaultForm: () => ({ name: '' }),
    })
  }

  it('fetchData populates list', async () => {
    const { fetchData, list } = createCrud()
    await fetchData()
    expect(fetchApi).toHaveBeenCalledOnce()
    expect(list.value).toEqual(mockData)
  })

  it('handleCreate opens drawer in create mode', () => {
    const { handleCreate, isEdit, editingId } = createCrud()
    handleCreate()
    expect(isEdit.value).toBe(false)
    expect(editingId.value).toBeUndefined()
  })

  it('handleEdit opens drawer in edit mode', () => {
    const { handleEdit, isEdit, editingId } = createCrud()
    handleEdit({ id: 1, name: 'Test' })
    expect(isEdit.value).toBe(true)
    expect(editingId.value).toBe(1)
  })

  it('applyFilter resets page to 1', () => {
    const { pagination, applyFilter } = createCrud()
    pagination.current = 3
    applyFilter()
    expect(pagination.current).toBe(1)
  })

  it('resetFilter clears filter and resets page', () => {
    const { filter, appliedFilter, pagination, resetFilter } = createCrud()
    Object.assign(filter, { name: 'test' })
    Object.assign(appliedFilter, { name: 'test' })
    pagination.current = 5
    resetFilter()
    expect(filter).toEqual({})
    expect(appliedFilter).toEqual({})
    expect(pagination.current).toBe(1)
  })

  it('pagination handlers update correctly', () => {
    const { pagination, onPageChange, onPageSizeChange } = createCrud()
    onPageChange(3)
    expect(pagination.current).toBe(3)
    onPageSizeChange(50)
    expect(pagination.pageSize).toBe(50)
    expect(pagination.current).toBe(1)
  })
})

describe('useCrud — immediateFilter', () => {
  const mockData: TestItem[] = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Beta' },
    { id: 3, name: 'Alpha Two' },
  ]

  const fetchApi = vi.fn().mockResolvedValue({ data: mockData })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createCrud() {
    return useCrud<TestItem, { name?: string }>({
      fetchApi,
      defaultForm: () => ({ name: '' }),
      immediateFilter: true,
      filterFn: (item, f) => {
        if (!f.name) return true
        return item.name.toLowerCase().includes(f.name.toLowerCase())
      },
    })
  }

  it('filter reacts immediately without applyFilter', async () => {
    const { fetchData, filter, filteredList } = createCrud()
    await fetchData()
    expect(filteredList.value).toHaveLength(3)

    Object.assign(filter, { name: 'alpha' })
    expect(filteredList.value).toHaveLength(2)

    Object.assign(filter, { name: '' })
    expect(filteredList.value).toHaveLength(3)
  })
})

describe('useCrud — onCreated callback', () => {
  const fetchApi = vi.fn().mockResolvedValue({ data: [] })
  const createApi = vi.fn().mockResolvedValue({ data: { id: 10, secret: 'abc' } })
  const onCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createCrud() {
    return useCrud<TestItem>({
      fetchApi,
      createApi,
      defaultForm: () => ({ name: '' }),
      onCreated,
    })
  }

  it('calls onCreated with response data on create', async () => {
    const { fetchData, handleDrawerSubmit } = createCrud()
    await fetchData()
    await handleDrawerSubmit()
    expect(onCreated).toHaveBeenCalledOnce()
    expect(onCreated).toHaveBeenCalledWith(
      { id: 10, secret: 'abc' },
      { data: { id: 10, secret: 'abc' } },
    )
  })
})

describe('useCrud — transformPayload', () => {
  const fetchApi = vi.fn().mockResolvedValue({ data: [] })
  const createApi = vi.fn().mockResolvedValue({ data: { id: 5 } })
  const updateApi = vi.fn().mockResolvedValue({})

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createCrud() {
    return useCrud<TestItem>({
      fetchApi,
      createApi,
      updateApi,
      defaultForm: () => ({ name: '', status: undefined }),
      transformPayload: (form, isEdit) => {
        const payload: Record<string, unknown> = { ...form }
        if (!isEdit) delete payload.status
        return payload as Partial<TestItem>
      },
    })
  }

  it('transformPayload is called on create', async () => {
    const { fetchData, handleDrawerSubmit, formData } = createCrud()
    await fetchData()
    Object.assign(formData, { name: 'test', status: 1 })
    await handleDrawerSubmit()
    expect(createApi).toHaveBeenCalledWith({ name: 'test' })
  })

  it('transformPayload is called on update with isEdit=true', async () => {
    const { fetchData, handleEdit, handleDrawerSubmit, formData } = createCrud()
    await fetchData()
    handleEdit({ id: 1, name: 'old' })
    Object.assign(formData, { name: 'new', status: 0 })
    await handleDrawerSubmit()
    expect(updateApi).toHaveBeenCalledWith(1, { id: 1, name: 'new', status: 0 })
  })
})

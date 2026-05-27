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

import { defineStore } from 'pinia'
import { useRepo } from 'pinia-orm'
import { nextTick } from 'vue'
import Category from '~/models/Category'
import Item from '~/models/Item'

export interface ItemPayload {
  id: number
  category_id: number
  name: string
  description: string | null
  price: number | string | null
  image_url: string | null
  uncertain: boolean
  sort_order: number
}

export interface CategoryPayload {
  id: number
  name: string
  sort_order: number
  items?: ItemPayload[]
}

export interface ItemInput {
  name?: string
  description?: string | null
  price?: number | null
  uncertain?: boolean
  category_id?: number
}

// decimal(10,2) can arrive as "87.50"; the app works with numbers.
function normalizeItem(item: ItemPayload) {
  return {
    ...item,
    price: item.price === null || item.price === '' ? null : Number(item.price),
    uncertain: Boolean(item.uncertain),
  }
}

function normalizeCategory(category: CategoryPayload) {
  return category.items ? { ...category, items: category.items.map(normalizeItem) } : category
}

function statusOf(error: unknown): number | undefined {
  return (error as { statusCode?: number })?.statusCode
}

/**
 * The menu being edited. Every mutation waits for the server; on any failure other than a
 * validation error the menu is reloaded, so the sheet never shows something the server doesn't have.
 */
export const useMenuStore = defineStore('menu', () => {
  const api = useApi()
  const auth = useAuthStore()
  const router = useRouter()

  /**
   * The one open editor on the sheet: `item:{id}`, `cat:{id}`, `add:{categoryId}` (quick add) or `newcat`.
   */
  const openKey = ref<string | null>(null)

  const categories = computed(() =>
    useRepo(Category)
      .with('items', q => q.orderBy('sort_order').orderBy('id'))
      .orderBy('sort_order')
      .orderBy('id')
      .get(),
  )
  const uncertainItems = computed(() => categories.value.flatMap(c => c.items.filter(i => i.uncertain)))

  function open(key: string) {
    openKey.value = key
  }

  /**
   * Closes the open editor and moves focus to `focusId` (the row or heading it came from).
   * With `onlyKey`, does nothing if another editor was opened meanwhile (a slow save must not close it).
   */
  function close(focusId?: string, onlyKey?: string) {
    if (onlyKey && openKey.value !== onlyKey) return
    openKey.value = null
    if (focusId && import.meta.client) {
      nextTick(() => document.getElementById(focusId)?.focus())
    }
  }

  /**
   * Items that just arrived from a read, with their reveal timing (ms): the row fades in, then the
   * highlighter is drawn on the uncertain ones. Cleared once the reveal is over, so a row that is
   * re-rendered later (editor closed) doesn't replay it.
   */
  const fresh = ref<Record<number, { row: number, mark: number | null }>>({})
  let freshTimer: ReturnType<typeof setTimeout> | undefined

  /** Reloads the menu and returns the ids that weren't there before, in sheet order. */
  async function reloadAndMarkNew(): Promise<number[]> {
    const before = new Set(useRepo(Item).all().map(i => i.id))
    await load()
    const added = categories.value.flatMap(c => c.items).filter(i => !before.has(i.id))

    const STAGGER = 30
    const ROW = 150
    const STROKE_GAP = 120
    const rowsEnd = Math.min(added.length, 20) * STAGGER + ROW
    const next: Record<number, { row: number, mark: number | null }> = {}
    let marks = 0
    added.forEach((item, i) => {
      next[item.id] = {
        row: Math.min(i, 20) * STAGGER,
        mark: item.uncertain ? rowsEnd + Math.min(marks++, 10) * STROKE_GAP : null,
      }
    })
    fresh.value = next
    clearTimeout(freshTimer)
    freshTimer = setTimeout(() => (fresh.value = {}), rowsEnd + Math.min(marks, 11) * STROKE_GAP + 1000)
    return added.map(i => i.id)
  }

  /** Brings an item row into view and puts focus on it. */
  function revealItem(id: number) {
    if (!import.meta.client) return
    nextTick(() => {
      const row = document.getElementById(`item-${id}`)
      row?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      row?.focus({ preventScroll: true })
    })
  }

  async function load() {
    const data = await api<CategoryPayload[]>('/api/categories')
    useRepo(Item).flush()
    useRepo(Category).flush()
    useRepo(Category).save(data.map(normalizeCategory))
  }

  async function guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run()
    }
    catch (error) {
      const status = statusOf(error)
      if (status === 401) {
        auth.setUser(null)
        await router.push('/giris')
      }
      else if (status !== 422) {
        await load().catch(() => {})
      }
      throw error
    }
  }

  function saveItem(payload: ItemPayload) {
    useRepo(Item).save(normalizeItem(payload))
  }

  /** Swaps a row with its neighbour and writes the whole order back. */
  function reorder(ids: number[], id: number, delta: -1 | 1): number[] | null {
    const from = ids.indexOf(id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= ids.length) return null
    const next = [...ids]
    next[from] = ids[to]!
    next[to] = id
    return next
  }

  // Categories

  async function addCategory(name: string) {
    return guard(async () => {
      const category = await api<CategoryPayload>('/api/categories', { method: 'POST', body: { name } })
      useRepo(Category).save(normalizeCategory({ ...category, items: category.items ?? [] }))
      return category
    })
  }

  async function renameCategory(id: number, name: string) {
    return guard(async () => {
      const category = await api<CategoryPayload>(`/api/categories/${id}`, { method: 'PUT', body: { name } })
      useRepo(Category).save(normalizeCategory(category))
    })
  }

  async function deleteCategory(id: number) {
    return guard(async () => {
      await api(`/api/categories/${id}`, { method: 'DELETE' })
      useRepo(Item).where('category_id', id).delete()
      useRepo(Category).destroy(id)
    })
  }

  async function moveCategory(id: number, delta: -1 | 1) {
    const ids = reorder(categories.value.map(c => c.id), id, delta)
    if (!ids) return
    ids.forEach((cid, i) => useRepo(Category).where('id', cid).update({ sort_order: i }))
    await guard(() => api('/api/categories/order', { method: 'PUT', body: { ids } }))
  }

  // Items

  async function addItem(categoryId: number, input: { name: string, price: number | null, description?: string | null }) {
    return guard(async () => {
      const item = await api<ItemPayload>(`/api/categories/${categoryId}/items`, { method: 'POST', body: { ...input } })
      saveItem(item)
      return item
    })
  }

  async function updateItem(id: number, input: ItemInput) {
    return guard(async () => {
      saveItem(await api<ItemPayload>(`/api/items/${id}`, { method: 'PUT', body: { ...input } }))
    })
  }

  async function deleteItem(id: number) {
    return guard(async () => {
      await api(`/api/items/${id}`, { method: 'DELETE' })
      useRepo(Item).destroy(id)
    })
  }

  async function moveItem(id: number, delta: -1 | 1) {
    const item = useRepo(Item).find(id)
    if (!item) return
    const siblings = useRepo(Item).where('category_id', item.category_id).orderBy('sort_order').orderBy('id').get()
    const ids = reorder(siblings.map(s => s.id), id, delta)
    if (!ids) return
    ids.forEach((iid, i) => useRepo(Item).where('id', iid).update({ sort_order: i }))
    await guard(() => api(`/api/categories/${item.category_id}/items/order`, { method: 'PUT', body: { ids } }))
  }

  async function uploadImage(id: number, image: Blob) {
    const body = new FormData()
    body.append('image', image, 'urun.jpg')
    return guard(async () => {
      saveItem(await api<ItemPayload>(`/api/items/${id}/image`, { method: 'POST', body }))
    })
  }

  async function removeImage(id: number) {
    return guard(async () => {
      saveItem(await api<ItemPayload>(`/api/items/${id}/image`, { method: 'DELETE' }))
    })
  }

  return {
    openKey,
    fresh,
    categories,
    uncertainItems,
    open,
    close,
    load,
    reloadAndMarkNew,
    revealItem,
    addCategory,
    renameCategory,
    deleteCategory,
    moveCategory,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    uploadImage,
    removeImage,
  }
})

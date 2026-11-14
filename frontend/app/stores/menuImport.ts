import { defineStore } from 'pinia'
import { markRaw } from 'vue'

export interface MenuImport {
  id: number
  status: 'pending' | 'done' | 'failed'
  image_count: number
  error: string | null
  added_items: number | null
  skipped_items: number | null
  created_at: string
}

interface Quota {
  limit: number
  used: number
  remaining: number
}

export interface PickedPhoto {
  key: number
  file: File
  url: string
}

export const MAX_PHOTOS = 5
const POLL_MS = 2000
const LONG_EDGE = 2000
const JPEG_QUALITY = 0.85

const FAILED_FALLBACK = 'Menü okunamadı. Fotoğraflar hakkınızdan düşülmedi. Tekrar deneyin.'

/**
 * Reading a menu from photos: the monthly quota, the photos picked for the next read,
 * and the read in progress (polled every 2s until it is done or failed).
 * State lives here, not in the upload component, because that component moves from the
 * empty-menu screen to the side column once the menu has items.
 */
export const useMenuImportStore = defineStore('menuImport', () => {
  const api = useApi()
  const menu = useMenuStore()
  const { show } = useToast()

  const quota = ref<Quota | null>(null)
  const current = ref<MenuImport | null>(null)
  const photos = ref<PickedPhoto[]>([])
  /** Local step before the server has the photos. */
  const sending = ref<'preparing' | 'uploading' | null>(null)
  /** Upload refused (422, network) or a read that failed in this session. */
  const error = ref('')
  /** The read that finished in this session. */
  const result = ref<{ added: number, summary: string, uncertain: number, firstUncertain: number | null } | null>(null)

  let timer: ReturnType<typeof setTimeout> | undefined
  let polling = false
  let keySeq = 0

  const reading = computed(() => current.value?.status === 'pending')
  const busy = computed(() => reading.value || sending.value !== null)

  /** Why the picked photos can't be read as they are; empty when they can. */
  const selectionProblem = computed(() => {
    const n = photos.value.length
    const left = quota.value?.remaining
    if (left === 0) return limitMessage()
    if (n > MAX_PHOTOS) return `Tek seferde en fazla ${MAX_PHOTOS} fotoğraf yükleyebilirsiniz. ${n - MAX_PHOTOS} fotoğrafı kaldırın.`
    if (left !== undefined && n > left) return `Bu ay ${left} fotoğraf hakkınız kaldı. En fazla ${left} fotoğraf seçin.`
    return ''
  })

  function limitMessage() {
    return `Bu ayki ${quota.value?.limit ?? 10} fotoğraf hakkınız doldu. Ürünleri elle ekleyebilirsiniz; hakkınız ayın 1'inde yenilenir.`
  }

  function setQuota(data: Quota) {
    quota.value = { limit: data.limit, used: data.used, remaining: data.remaining }
  }

  /** Quota and the last read. Returns the read when it is still running. */
  async function load() {
    const data = await api<Quota & { latest: MenuImport | null }>('/api/menu-imports')
    setQuota(data)
    if (data.latest?.status === 'pending') current.value = data.latest
    return data.latest
  }

  function add(files: FileList | File[]) {
    error.value = ''
    result.value = null
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      photos.value.push(markRaw({ key: ++keySeq, file, url: URL.createObjectURL(file) }))
    }
  }

  function remove(key: number) {
    const photo = photos.value.find(p => p.key === key)
    if (photo) URL.revokeObjectURL(photo.url)
    photos.value = photos.value.filter(p => p.key !== key)
    error.value = ''
  }

  function clearPhotos() {
    photos.value.forEach(p => URL.revokeObjectURL(p.url))
    photos.value = []
  }

  async function submit() {
    if (busy.value || !photos.value.length || selectionProblem.value) return
    error.value = ''
    result.value = null

    sending.value = 'preparing'
    const body = new FormData()
    try {
      for (const [i, photo] of photos.value.entries()) {
        body.append('images[]', await resizeImage(photo.file, LONG_EDGE, JPEG_QUALITY), `menu-${i + 1}.jpg`)
      }
    }
    catch {
      sending.value = null
      error.value = 'Fotoğraflardan biri açılamadı. JPG, PNG veya WEBP fotoğraf seçin.'
      return
    }

    sending.value = 'uploading'
    try {
      const data = await api<Quota & { import: MenuImport }>('/api/menu-imports', { method: 'POST', body })
      setQuota(data)
      current.value = data.import
      poll()
    }
    catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 401) return expired()
      const form = toFormErrors(e)
      error.value = Object.values(form.fields)[0] ?? (form.message || 'Fotoğraflar gönderilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.')
      if (status === 422) refreshQuota()
    }
    finally {
      sending.value = null
    }
  }

  function refreshQuota() {
    api<Quota>('/api/menu-imports').then(setQuota).catch(() => {})
  }

  async function expired() {
    stop()
    useAuthStore().setUser(null)
    await navigateTo('/giris')
  }

  /** Polls the running read every 2s. Safe to call twice. */
  function poll() {
    if (polling || !current.value || current.value.status !== 'pending') return
    polling = true
    schedule()
  }

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(tick, POLL_MS)
  }

  async function tick() {
    const id = current.value?.id
    if (!polling || !id) return
    let next: MenuImport
    try {
      next = await api<MenuImport>(`/api/menu-imports/${id}`)
    }
    catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 401) return expired()
      if (status === 404) {
        stop()
        current.value = null
        error.value = FAILED_FALLBACK
        return
      }
      // A dropped connection: keep asking.
      if (polling) schedule()
      return
    }
    if (!polling) return
    current.value = next
    if (next.status === 'pending') return schedule()

    polling = false
    if (next.status === 'done') await finish(next)
    else {
      error.value = next.error || FAILED_FALLBACK
      refreshQuota()
    }
  }

  async function finish(done: MenuImport) {
    let added: number[] = []
    try {
      added = await menu.reloadAndMarkNew()
    }
    catch {
      error.value = 'Ürünler eklendi ama menü yenilenemedi. Sayfayı yenileyin.'
    }
    const count = done.added_items ?? added.length
    const uncertain = menu.uncertainItems.filter(i => added.includes(i.id))
    const summary = addedSummary(count, done.skipped_items ?? 0)
    result.value = { added: count, summary, uncertain: uncertain.length, firstUncertain: uncertain[0]?.id ?? null }
    clearPhotos()
    current.value = null
    show(summary)
    // Where the additions start; the "kontrol edin" link takes them to the marked ones.
    if (added[0]) menu.revealItem(added[0])
  }

  function stop() {
    polling = false
    clearTimeout(timer)
  }

  return {
    quota,
    current,
    photos,
    sending,
    error,
    result,
    reading,
    busy,
    selectionProblem,
    load,
    add,
    remove,
    submit,
    poll,
    stop,
  }
})

function addedSummary(added: number, skipped: number): string {
  if (!added && skipped) return `Okunan ${skipped} ürünün hepsi zaten menünüzde vardı, yeni ürün eklenmedi.`
  if (skipped) return `${added} ürün eklendi. ${skipped} tanesi zaten menünüzde olduğu için eklenmedi.`
  return `${added} ürün eklendi.`
}

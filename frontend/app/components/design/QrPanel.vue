<!--
  The QR code for the menu address: style, optional logo in the centre, PNG/SVG download.
  Drawn entirely in the browser with qr-code-styling; nothing is stored on the server.
  Only offered once the menu is published, because only then is the address fixed.
-->
<script setup lang="ts">
import type QRCodeStyling from 'qr-code-styling'
import type { QrStyle, QrStyleKey } from '~/utils/qrStyles'

const store = useRestaurantStore()
const { apiBase } = useRuntimeConfig().public
const restaurant = computed(() => store.restaurant)
const published = computed(() => !!restaurant.value?.published_at)
const hasLogo = computed(() => !!restaurant.value?.logo_url)

const PREVIEW = 320
const PNG = 2048
const SVG = 1024

// The address: siteUrl from the runtime config, otherwise this page's origin (set on the client).
const origin = ref(useSiteOrigin())
const url = computed(() => restaurant.value ? `${origin.value}/qr/${restaurant.value.slug}` : '')
const fileName = computed(() => `${restaurant.value?.slug ?? 'menu'}-qr`)

const styleKey = ref<QrStyleKey>('siyah')
const style = computed(() => qrStyle(styleKey.value))
const withLogo = ref(false)
const logoData = ref<string | null>(null)
const logoState = ref<'idle' | 'loading' | 'error'>('idle')

let Lib: typeof QRCodeStyling | null = null
const ready = ref(false)
const box = ref<HTMLElement | null>(null)

onMounted(async () => {
  if (!useRuntimeConfig().public.siteUrl) origin.value = window.location.origin
  Lib = (await import('qr-code-styling')).default
  ready.value = true
})

/** The logo comes through the API (same CORS as everything else), so canvases stay untainted. */
async function loadLogo() {
  logoState.value = 'loading'
  try {
    const blob = await $fetch<Blob>('/api/restaurant/logo', { baseURL: apiBase, credentials: 'include', responseType: 'blob' })
    logoData.value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    logoState.value = 'idle'
  }
  catch {
    logoState.value = 'error'
    withLogo.value = false
  }
}

watch(withLogo, (on) => {
  if (on && !logoData.value) loadLogo()
})
// A new or removed logo: fetch again next time.
watch(() => restaurant.value?.logo_url, (now) => {
  logoData.value = null
  if (!now) withLogo.value = false
  else if (withLogo.value) loadLogo()
})

const logo = computed(() => (withLogo.value && logoData.value ? logoData.value : null))

function make(size: number, type: 'svg' | 'canvas') {
  return new Lib!(qrOptions(url.value, style.value, size, logo.value, type))
}

watchEffect(() => {
  if (!ready.value || !published.value || !box.value || !url.value) return
  if (withLogo.value && !logoData.value) return // wait for the logo instead of flashing a plain code
  const qr = make(PREVIEW, 'svg')
  box.value.replaceChildren()
  qr.append(box.value)
})

const downloading = ref<'png' | 'svg' | null>(null)
const downloadError = ref('')

async function download(extension: 'png' | 'svg') {
  if (!Lib) return
  downloadError.value = ''
  downloading.value = extension
  try {
    const qr = make(extension === 'png' ? PNG : SVG, extension === 'png' ? 'canvas' : 'svg')
    await qr.download({ name: fileName.value, extension })
  }
  catch {
    downloadError.value = 'QR kodu indirilemedi. Tekrar deneyin.'
  }
  finally {
    downloading.value = null
  }
}

function toPublish() {
  const el = document.getElementById('publish-title')
  el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  document.querySelector<HTMLButtonElement>('[data-publish]')?.focus({ preventScroll: true })
}

/** The finder-pattern glyph inside each round swatch, drawn in the style's own shapes. */
function ringRadius(s: QrStyle) {
  return s.cornerSquareType === 'dot' ? 11 : s.cornerSquareType === 'extra-rounded' ? 6 : 0.5
}
function eyeRadius(s: QrStyle) {
  return s.cornerDotType === 'dot' ? 4.5 : 0.5
}
</script>

<template>
  <section v-if="restaurant" aria-labelledby="qr-title">
    <h2 id="qr-title" class="font-condensed text-h2">
      QR kodu
    </h2>

    <template v-if="!published">
      <p class="measure mt-2 text-graphite-2">
        QR kodu menünüzün adresini taşır. Adres, menüyü yayınladığınızda kesinleşir; bu yüzden QR kodunu yayından sonra indirebilirsiniz. Önceden basılan bir kod, adı değiştirirseniz açılmayabilir.
      </p>
      <a href="#publish-title" class="btn-text mt-2" @click.prevent="toPublish">Menüyü yayınlayın</a>
    </template>

    <template v-else>
      <p class="measure mt-2 text-graphite-2">
        Masalara, menüye ya da vitrine basın. Telefonla okutulunca menünüz açılır.
      </p>

      <div class="mt-6 flex flex-col gap-8 md:flex-row md:items-start">
        <figure class="w-full max-w-[280px] shrink-0">
          <div
            class="qr-box aspect-square w-full overflow-hidden rounded-control border border-rule"
            :style="{ background: style.background }"
          >
            <div ref="box" class="qr-canvas size-full" role="img" :aria-label="`${style.name} stilinde QR kodu: ${url}`" />
            <p v-if="!ready || (withLogo && logoState === 'loading')" :style="{ background: style.background }" class="grid size-full place-items-center text-small text-graphite-2">
              QR kodu hazırlanıyor…
            </p>
          </div>
          <figcaption class="mt-2 text-small break-all text-graphite-2">
            {{ url }}
          </figcaption>
        </figure>

        <div class="min-w-0 flex-1">
          <fieldset>
            <legend class="label">
              Stil
            </legend>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="s in QR_STYLES" :key="s.key" class="group flex cursor-pointer flex-col items-center gap-1.5 py-1 text-center">
                <input
                  v-model="styleKey"
                  type="radio"
                  name="qr-style"
                  class="peer sr-only"
                  :value="s.key"
                  :aria-describedby="`qr-style-${s.key}`"
                >
                <span
                  class="grid size-12 place-items-center rounded-full border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
                  :class="styleKey === s.key ? 'border-ink' : 'border-transparent group-hover:border-line-strong'"
                >
                  <svg viewBox="0 0 40 40" class="size-10" aria-hidden="true">
                    <circle cx="20" cy="20" r="19.5" :fill="s.background" stroke="#C7D0EC" />
                    <rect x="9" y="9" width="22" height="22" :rx="ringRadius(s)" fill="none" :stroke="s.corners" stroke-width="3.4" />
                    <rect x="15.5" y="15.5" width="9" height="9" :rx="eyeRadius(s)" :fill="s.dots" />
                  </svg>
                </span>
                <span class="text-small" :class="styleKey === s.key ? 'font-semibold text-graphite' : 'text-graphite-2'">{{ s.name }}</span>
                <span :id="`qr-style-${s.key}`" class="sr-only">{{ s.description }}</span>
              </label>
            </div>
          </fieldset>
          <p class="mt-2 text-small text-graphite-2">
            {{ style.description }}
          </p>

          <div class="mt-6">
            <label v-if="hasLogo" class="flex min-h-11 cursor-pointer items-center gap-3">
              <input v-model="withLogo" type="checkbox" class="size-5 shrink-0 accent-ink" :disabled="logoState === 'loading'">
              <span class="font-semibold">Ortada logo göster</span>
            </label>
            <p v-else class="measure text-small text-graphite-2">
              Ortaya logo koymak için önce restoran bilgilerinden logo yükleyin.
            </p>
            <p v-if="logoState === 'error'" class="mt-1 text-small text-redpen" role="alert">
              Logo yüklenemedi. Tekrar deneyin.
            </p>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <button type="button" class="btn-primary" :disabled="!ready || downloading !== null || (withLogo && !logoData)" @click="download('png')">
              {{ downloading === 'png' ? 'PNG hazırlanıyor…' : 'PNG indir' }}
            </button>
            <button type="button" class="btn-secondary" :disabled="!ready || downloading !== null || (withLogo && !logoData)" @click="download('svg')">
              {{ downloading === 'svg' ? 'SVG hazırlanıyor…' : 'SVG indir' }}
            </button>
          </div>
          <FieldError v-if="downloadError" id="qr-download-error" :message="downloadError" />

          <p class="measure mt-4 text-small text-graphite-2">
            En az 3 cm genişlikte basın. Bastırmadan önce telefonunuzun kamerasıyla okutup menünün açıldığını deneyin. PNG ({{ PNG }} piksel) ev ve ofis yazıcısına yeter; matbaa genellikle SVG ister.
          </p>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.qr-box {
  position: relative;
}

.qr-box > p {
  position: absolute;
  inset: 0;
}

.qr-canvas :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>

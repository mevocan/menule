<!-- Publishing: what it means before, the live address after. -->
<script setup lang="ts">
const store = useRestaurantStore()
const menu = useMenuStore()
const { show } = useToast()

const restaurant = computed(() => store.restaurant)
const origin = useSiteOrigin()
const url = computed(() => restaurant.value ? `${origin}/qr/${restaurant.value.slug}` : '')
const path = computed(() => restaurant.value ? `/qr/${restaurant.value.slug}` : '')

const itemCount = computed(() => menu.categories.reduce((n, c) => n + c.items.length, 0))
const uncertain = computed(() => menu.uncertainItems.length)

const publishing = ref(false)
const error = ref('')
const status = ref<HTMLElement | null>(null)

async function publish() {
  error.value = ''
  publishing.value = true
  try {
    await store.publish()
    show('Menü yayınlandı')
    await nextTick()
    status.value?.focus()
  }
  catch (e) {
    const form = toFormErrors(e)
    error.value = form.fields.menu ?? Object.values(form.fields)[0] ?? form.message
  }
  finally {
    publishing.value = false
  }
}

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(url.value)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = false), 2500)
  }
  catch {
    show('Adres kopyalanamadı. Adresi seçip kendiniz kopyalayın.')
  }
}
onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <section v-if="restaurant" aria-labelledby="publish-title">
    <h2 id="publish-title" class="font-condensed text-h2">
      Yayın
    </h2>

    <template v-if="restaurant.published_at">
      <p ref="status" tabindex="-1" class="mt-2 font-semibold text-ink focus:outline-none">
        Menünüz yayında.
      </p>
      <p class="label mt-4">
        Menü adresiniz
      </p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p class="min-w-0 basis-full break-words">
          {{ url }}
        </p>
        <button type="button" class="btn-text" @click="copy">
          {{ copied ? 'Kopyalandı' : 'Kopyala' }}
        </button>
        <a :href="path" target="_blank" rel="noopener" class="btn-text hover:underline">
          Aç<span class="sr-only"> (yeni sekmede)</span>
        </a>
      </div>
      <p class="sr-only" role="status">
        {{ copied ? 'Adres kopyalandı' : '' }}
      </p>
      <p class="measure mt-2 text-small text-graphite-2">
        Bu adres artık değişmez. Menüde ve tasarımda yaptığınız değişiklikler hemen bu adreste görünür.
      </p>
    </template>

    <template v-else>
      <p class="mt-2 text-graphite-2">
        Menünüz henüz yayında değil.
      </p>
      <p class="measure mt-3 text-small break-words">
        Yayınladığınızda menünüz <span class="font-semibold">{{ url }}</span> adresinde açılır. Bu adres bundan sonra değişmez; QR kodunu bu adrese göre bastırabilirsiniz.
      </p>

      <p v-if="!itemCount" class="measure mt-4 text-small">
        Yayınlamak için menünüze en az bir ürün ekleyin.
        <NuxtLink to="/panel" class="font-semibold text-ink underline underline-offset-[0.2em]">
          Menüye git
        </NuxtLink>
      </p>
      <p v-else-if="uncertain" id="publish-uncertain" class="measure mt-4 border-l-[3px] border-marker-edge pl-3 text-small">
        <span class="tag-check mr-1.5">Kontrol et</span>
        {{ uncertain }} ürün kontrol edilmedi. Yine de yayınlayabilirsiniz, sonra düzeltirseniz menüde hemen güncellenir.
        <NuxtLink to="/panel" class="font-semibold text-ink underline underline-offset-[0.2em]">
          Ürünleri kontrol et
        </NuxtLink>
      </p>

      <button
        type="button"
        data-publish
        class="btn-primary mt-5 w-full md:w-auto lg:w-full"
        :disabled="publishing || !itemCount"
        :aria-describedby="[uncertain && itemCount ? 'publish-uncertain' : '', error ? 'publish-error' : ''].filter(Boolean).join(' ') || undefined"
        @click="publish"
      >
        {{ publishing ? 'Yayınlanıyor…' : 'Menüyü yayınla' }}
      </button>
      <FieldError v-if="error" id="publish-error" :message="error" />
    </template>
  </section>
</template>

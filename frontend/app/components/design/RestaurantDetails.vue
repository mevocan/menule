<!-- Restaurant name (and what it does to the address) and the logo. -->
<script setup lang="ts">
const store = useRestaurantStore()
const { show } = useToast()
const restaurant = computed(() => store.restaurant)
const published = computed(() => !!restaurant.value?.published_at)
const host = new URL(useSiteOrigin()).host

const LOGO_EDGE = 600

// Name
const name = ref(restaurant.value?.name ?? '')
watch(() => restaurant.value?.name, (n) => {
  if (n !== undefined && !savingName.value) name.value = n
})
const nameError = ref('')
const savingName = ref(false)
const changed = computed(() => name.value.trim() !== (restaurant.value?.name ?? ''))
const nextSlug = computed(() => slugPreview(name.value) || 'restoran-adiniz')

async function saveName() {
  nameError.value = ''
  if (!name.value.trim()) {
    nameError.value = 'Restoran adını yazın. Menünüzün başlığında görünecek.'
    return
  }
  savingName.value = true
  try {
    await store.update({ name: name.value.trim() })
    show('Restoran adı kaydedildi')
  }
  catch (error) {
    const e = toFormErrors(error)
    nameError.value = e.fields.name ?? e.message
  }
  finally {
    savingName.value = false
  }
}

// Logo
const fileInput = ref<HTMLInputElement | null>(null)
const logoError = ref('')
const logoBusy = ref<'upload' | 'remove' | null>(null)
const confirming = ref(false)
const confirmCancel = ref<HTMLButtonElement | null>(null)

async function pickLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  logoError.value = ''
  logoBusy.value = 'upload'
  try {
    // PNG and WEBP logos often have a transparent background: keep it, so the logo sits on any theme.
    const keepAlpha = file.type === 'image/png' || file.type === 'image/webp'
    let image: Blob
    try {
      image = await resizeImage(file, LOGO_EDGE, 0.9, keepAlpha ? 'image/png' : 'image/jpeg')
    }
    catch {
      logoError.value = 'Bu dosya açılamadı. JPG, PNG veya WEBP bir görsel seçin.'
      return
    }
    await store.uploadLogo(image, keepAlpha ? 'logo.png' : 'logo.jpg')
    show('Logo kaydedildi')
  }
  catch (error) {
    const e = toFormErrors(error)
    logoError.value = e.fields.logo ?? e.message
  }
  finally {
    logoBusy.value = null
  }
}

async function askRemove() {
  confirming.value = true
  await nextTick()
  confirmCancel.value?.focus()
}

async function removeLogo() {
  logoError.value = ''
  logoBusy.value = 'remove'
  try {
    await store.removeLogo()
    show('Logo kaldırıldı')
  }
  catch (error) {
    logoError.value = toFormErrors(error).message
  }
  finally {
    logoBusy.value = null
    confirming.value = false
  }
}
</script>

<template>
  <section v-if="restaurant" aria-labelledby="details-title">
    <h2 id="details-title" class="font-condensed text-h2">
      Restoran bilgileri
    </h2>

    <form class="mt-4" novalidate @submit.prevent="saveName">
      <label for="restaurant-name" class="label">Restoran adı</label>
      <div class="flex flex-wrap gap-3">
        <input
          id="restaurant-name"
          v-model="name"
          type="text"
          class="input min-w-0 flex-1 basis-52"
          autocomplete="organization"
          maxlength="120"
          :aria-invalid="!!nameError || undefined"
          :aria-describedby="nameError ? 'restaurant-name-error restaurant-name-help' : 'restaurant-name-help'"
        >
        <button v-if="changed" type="submit" class="btn-secondary" :disabled="savingName">
          {{ savingName ? 'Kaydediliyor…' : 'Kaydet' }}
        </button>
      </div>
      <FieldError v-if="nameError" id="restaurant-name-error" :message="nameError" />
      <p id="restaurant-name-help" class="measure mt-1.5 text-small text-graphite-2 break-words">
        <template v-if="published">
          Menünüz yayında olduğu için adresi değişmez: {{ host }}/qr/{{ restaurant.slug }}. Yeni ad yalnızca menünün başlığında görünür.
        </template>
        <template v-else-if="changed">
          Kaydederseniz menü adresiniz {{ host }}/qr/{{ nextSlug }} olur. Yayınladıktan sonra adres bir daha değişmez.
        </template>
        <template v-else>
          Menü adresiniz adınızdan oluşur: {{ host }}/qr/{{ restaurant.slug }}. Yayınlayana kadar adı değiştirirseniz adres de değişir.
        </template>
      </p>
    </form>

    <div class="mt-6">
      <p id="logo-label" class="label">
        Logo <span class="font-normal text-graphite-2">(isteğe bağlı)</span>
      </p>
      <div class="flex items-center gap-4">
        <div class="grid size-20 shrink-0 place-items-center rounded-control border border-rule bg-paper p-2">
          <img v-if="restaurant.logo_url" :src="restaurant.logo_url" :alt="`${restaurant.name} logosu`" class="max-h-full max-w-full object-contain">
          <span v-else class="text-small text-graphite-2">Logo yok</span>
        </div>
        <div v-if="confirming" class="flex flex-wrap items-center gap-x-4">
          <span class="font-semibold">Logo kaldırılsın mı?</span>
          <button type="button" class="btn-text text-redpen" :disabled="logoBusy !== null" @click="removeLogo">
            {{ logoBusy === 'remove' ? 'Kaldırılıyor…' : 'Kaldır' }}
          </button>
          <button ref="confirmCancel" type="button" class="btn-text" :disabled="logoBusy !== null" @click="confirming = false">
            Vazgeç
          </button>
        </div>
        <div v-else class="flex flex-wrap items-center gap-x-5">
          <button
            type="button"
            class="btn-text"
            aria-describedby="logo-label logo-help"
            :disabled="logoBusy !== null"
            @click="fileInput?.click()"
          >
            <template v-if="logoBusy === 'upload'">
              Logo yükleniyor…
            </template>
            <template v-else>
              {{ restaurant.logo_url ? 'Logoyu değiştir' : 'Logo yükle' }}
            </template>
          </button>
          <button
            v-if="restaurant.logo_url"
            type="button"
            class="btn-text text-redpen"
            :disabled="logoBusy !== null"
            @click="askRemove"
          >
            Logoyu kaldır
          </button>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="sr-only"
        tabindex="-1"
        aria-hidden="true"
        @change="pickLogo"
      >
      <FieldError v-if="logoError" id="logo-error" :message="logoError" />
      <p id="logo-help" class="measure mt-1.5 text-small text-graphite-2">
        Logo, menünün başında restoran adının üstünde görünür. Arka planı şeffaf bir PNG her temada iyi durur.
      </p>
    </div>
  </section>
</template>

<!--
  The owner's own menu in all three themes, side by side as phone-sized previews.
  Picking one saves it right away. An empty menu is previewed with a short sample menu.
-->
<script setup lang="ts">
import type { PublicMenu, ThemeKey } from '~/types/menu'

const store = useRestaurantStore()
const menu = useMenuStore()
const { show } = useToast()

/** The preview canvas: a 390px-wide phone, scaled down to fit. */
const PHONE_W = 390
const PHONE_H = 760
const GAP = 24
const MIN_W = 232
const MAX_W = 320

const restaurant = computed(() => store.restaurant)

const ownMenu = computed<PublicMenu>(() => ({
  name: restaurant.value?.name ?? '',
  slug: restaurant.value?.slug ?? '',
  theme: restaurant.value?.theme ?? null,
  logo_url: restaurant.value?.logo_url ?? null,
  categories: menu.categories
    .filter(c => c.items.length)
    .map(c => ({
      id: c.id,
      name: c.name,
      items: c.items.map(i => ({ id: i.id, name: i.name, description: i.description, price: i.price, image_url: i.image_url })),
    })),
}))
const isSample = computed(() => !ownMenu.value.categories.length)
const previewMenu = computed(() => isSample.value ? sampleMenu(ownMenu.value.name, ownMenu.value.logo_url) : ownMenu.value)

// Selection: shown at once, reverted if the server says no.
const selected = ref<ThemeKey>(themeInfo(restaurant.value?.theme).key)
watch(() => restaurant.value?.theme, t => (selected.value = themeInfo(t).key))
const saving = ref<ThemeKey | null>(null)
const error = ref('')

async function choose(key: ThemeKey) {
  if (saving.value) return
  const before = themeInfo(restaurant.value?.theme).key
  if (key === before) return
  selected.value = key
  error.value = ''
  saving.value = key
  try {
    await store.update({ theme: key })
    show(`${themeInfo(key).name} teması seçildi`)
  }
  catch (e) {
    selected.value = before
    error.value = toFormErrors(e).message || 'Tema kaydedilemedi. Tekrar deneyin.'
  }
  finally {
    saving.value = null
  }
}

// Fit three previews side by side when there is room; otherwise a horizontal row to swipe.
const row = ref<HTMLElement | null>(null)
const frameW = ref(272)
const sideBySide = ref(false)
let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    const width = entry!.contentRect.width
    const fit = (width - GAP * 2) / 3
    sideBySide.value = fit >= MIN_W
    frameW.value = Math.floor(sideBySide.value ? Math.min(MAX_W, fit) : Math.min(288, width * 0.78))
  })
  if (row.value) observer.observe(row.value)
})
onBeforeUnmount(() => observer?.disconnect())

// The frame has a 2px border on each side; the phone fills what is inside it.
const scale = computed(() => (frameW.value - 4) / PHONE_W)
const frameH = computed(() => Math.round(PHONE_H * scale.value))
</script>

<template>
  <section aria-labelledby="theme-title">
    <h2 id="theme-title" class="font-condensed text-h2">
      Tema
    </h2>
    <p class="measure mt-1 text-graphite-2">
      Müşterileriniz menünüzü telefonda böyle görür. Seçtiğiniz tema hemen kaydedilir.
    </p>
    <p v-if="isSample" class="measure mt-3 text-small">
      <span class="font-semibold">Bu bir örnek menü.</span>
      Menünüze ürün ekleyince önizlemelerde kendi menünüzü görürsünüz.
    </p>

    <FormBanner v-if="error" class="mt-4" :message="error" />

    <div ref="row" class="mt-5">
      <fieldset class="min-w-0">
        <legend class="sr-only">
          Menü teması
        </legend>
        <div
          class="flex gap-6"
          :class="sideBySide ? '' : '-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-3 md:-mx-8 md:px-8'"
        >
          <label
            v-for="theme in THEMES"
            :key="theme.key"
            class="relative block shrink-0 cursor-pointer snap-start"
            :style="{ width: `${frameW}px` }"
          >
            <input
              type="radio"
              name="theme"
              class="peer sr-only"
              :value="theme.key"
              :checked="selected === theme.key"
              :disabled="saving !== null"
              :aria-describedby="`theme-${theme.key}-desc`"
              @change="choose(theme.key)"
            >
            <div
              class="relative overflow-hidden rounded-control border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
              :class="selected === theme.key ? 'border-ink' : 'border-rule hover:border-line-strong'"
              :style="{ height: `${frameH + 4}px`, background: theme.ground }"
            >
              <div
                class="origin-top-left"
                :style="{ width: `${PHONE_W}px`, height: `${PHONE_H}px`, transform: `scale(${scale})` }"
              >
                <!-- Desktop: the preview scrolls with the wheel. Touch: fixed, so swiping moves the row, not the menu. -->
                <div class="h-full overflow-hidden overscroll-contain lg:overflow-y-auto" :class="sideBySide && 'preview-scroll'">
                  <div inert aria-hidden="true">
                    <MenuTheme :menu="previewMenu" :theme="theme.key" preview />
                  </div>
                </div>
              </div>
            </div>
            <span class="mt-3 flex items-baseline justify-between gap-3">
              <span class="text-item font-semibold">{{ theme.name }}</span>
              <span v-if="saving === theme.key" class="text-small text-graphite-2">Kaydediliyor…</span>
              <span v-else-if="selected === theme.key" class="text-small font-semibold text-ink">Seçili</span>
            </span>
            <span :id="`theme-${theme.key}-desc`" class="mt-0.5 block text-small text-graphite-2">
              {{ theme.description }}
            </span>
          </label>
        </div>
      </fieldset>
    </div>
  </section>
</template>

<style scoped>
.preview-scroll {
  scrollbar-width: thin;
}
</style>

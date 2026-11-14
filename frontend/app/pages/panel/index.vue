<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Menü · Menüle' })

const auth = useAuthStore()
const menu = useMenuStore()
const imports = useMenuImportStore()
const restaurant = computed(() => auth.user?.restaurant ?? null)
const origin = useSiteOrigin()
const publicUrl = computed(() => restaurant.value ? `${origin}/qr/${restaurant.value.slug}` : '')

const { error: loadError, refresh, status } = await useAsyncData('menu', async () => {
  // The quota is secondary: if it can't be loaded the menu still opens.
  await Promise.all([menu.load(), imports.load().catch(() => null)])
  return true
})

const categoryOptions = computed(() => menu.categories.map(c => ({ id: c.id, name: c.name })))
const uncertainCount = computed(() => menu.uncertainItems.length)

function goToUncertain() {
  const first = menu.uncertainItems[0]
  if (first) menu.revealItem(first.id)
}

// A read started before a reload (or on another visit) is picked up again; polling stops on leaving.
onMounted(() => imports.poll())
onBeforeUnmount(() => imports.stop())
</script>

<template>
  <div class="min-h-dvh">
    <PanelHeader />

    <div class="lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="px-4 pt-6 md:px-8 lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:overflow-y-auto lg:bg-carbon lg:pt-8">
        <template v-if="restaurant">
          <h1 class="font-condensed text-h1 break-words">
            {{ restaurant.name }}
          </h1>
          <p v-if="restaurant.published_at" class="mt-1 font-semibold text-ink">
            Yayında
          </p>
          <p v-else class="mt-1 flex flex-wrap items-baseline gap-x-3 text-graphite-2">
            <span>Yayında değil</span>
            <NuxtLink to="/panel/tasarim" class="font-semibold text-ink underline-offset-[0.2em] hover:underline">
              Yayınla
            </NuxtLink>
          </p>

          <p class="label mt-6">
            Menü adresiniz
          </p>
          <a
            v-if="restaurant.published_at"
            :href="publicUrl"
            target="_blank"
            rel="noopener"
            class="break-words text-ink underline underline-offset-[0.2em] hover:text-ink-press"
          >{{ publicUrl }}</a>
          <p v-else class="break-words">
            {{ publicUrl }}
          </p>
          <p v-if="!restaurant.published_at" class="mt-1.5 text-small text-graphite-2">
            Menüyü yayınladığınızda bu adres açılır.
          </p>
        </template>

        <MenuPhotoUpload v-if="menu.categories.length" class="mt-6 lg:mt-8" />
      </aside>

      <main class="px-4 pt-8 pb-24 md:px-8 lg:pt-8">
        <div class="max-w-[720px] border-t border-rule pt-8 lg:border-t-0 lg:pt-0">
          <template v-if="loadError">
            <FormBanner message="Menü yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin." />
            <button type="button" class="btn-secondary mt-4" :disabled="status === 'pending'" @click="refresh()">
              {{ status === 'pending' ? 'Yükleniyor…' : 'Tekrar dene' }}
            </button>
          </template>

          <template v-else-if="!menu.categories.length">
            <h2 class="font-condensed text-h2">
              Menünüz henüz boş
            </h2>
            <p class="measure mt-3 text-graphite-2">
              Kâğıt menünüzün fotoğrafını okutun ya da ürünleri kendiniz yazın. İkisini birlikte de kullanabilirsiniz.
            </p>

            <!-- Two equal paths: stacked on mobile with the photo first, side by side from md. -->
            <div class="mt-6 grid gap-8 md:grid-cols-2 md:gap-0">
              <MenuPhotoUpload prominent class="md:pr-8" />
              <section aria-labelledby="manual-title" class="border-t border-rule pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                <h3 id="manual-title" class="text-item font-semibold">
                  Elle ekle
                </h3>
                <p class="measure mt-1 mb-4 text-small text-graphite-2">
                  Önce bir kategori ekleyin, sonra ürünlerini ve fiyatlarını yazın.
                </p>
                <MenuCategoryAdd first />
              </section>
            </div>
          </template>

          <template v-else>
            <button
              v-if="uncertainCount"
              type="button"
              class="btn-text -mt-3 mb-5"
              @click="goToUncertain"
            >
              {{ uncertainCount }} ürünü kontrol edin
            </button>

            <div class="space-y-8">
              <MenuCategory
                v-for="(category, i) in menu.categories"
                :key="category.id"
                :category="category"
                :index="i"
                :count="menu.categories.length"
                :categories="categoryOptions"
              />
            </div>

            <MenuCategoryAdd class="mt-8" />
          </template>
        </div>
      </main>
    </div>

    <AppToast />
  </div>
</template>

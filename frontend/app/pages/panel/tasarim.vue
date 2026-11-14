<!--
  Tasarım: theme choice, restaurant details, publishing and the QR code.
  Desktop: side column (status, publish, details) next to the previews.
  Mobile: one column in working order: status, theme, details, publish, QR.
  The two columns use `display: contents` below lg so their sections can be reordered.
-->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Tasarım · Menüle' })

const store = useRestaurantStore()
const menu = useMenuStore()
const restaurant = computed(() => store.restaurant)

// The previews and the "N ürün kontrol edilmedi" warning need the menu.
const { error: loadError, refresh, status } = await useAsyncData('menu-design', async () => {
  await menu.load()
  return true
})
</script>

<template>
  <div class="min-h-dvh">
    <PanelHeader />

    <main class="flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <div class="contents lg:sticky lg:top-14 lg:block lg:h-[calc(100dvh-3.5rem)] lg:overflow-y-auto lg:bg-carbon lg:px-8 lg:pt-8 lg:pb-12">
        <div v-if="restaurant" class="order-1 px-4 pt-6 md:px-8 lg:order-none lg:p-0">
          <h1 class="font-condensed text-h1 break-words">
            {{ restaurant.name }}
          </h1>
          <p class="mt-1" :class="restaurant.published_at ? 'font-semibold text-ink' : 'text-graphite-2'">
            {{ restaurant.published_at ? 'Yayında' : 'Yayında değil' }}
          </p>
        </div>

        <DesignPublishPanel class="order-4 mx-4 mt-10 border-t border-rule pt-8 md:mx-8 lg:order-none lg:mx-0 lg:mt-8" />
        <DesignRestaurantDetails class="order-3 mx-4 mt-10 border-t border-rule pt-8 md:mx-8 lg:order-none lg:mx-0 lg:mt-8" />
      </div>

      <div class="contents lg:block lg:px-8 lg:pt-8 lg:pb-24">
        <div class="order-2 mx-4 mt-8 border-t border-rule pt-8 md:mx-8 lg:order-none lg:mx-0 lg:mt-0 lg:border-t-0 lg:pt-0">
          <template v-if="loadError">
            <FormBanner message="Menü yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin." />
            <button type="button" class="btn-secondary mt-4" :disabled="status === 'pending'" @click="refresh()">
              {{ status === 'pending' ? 'Yükleniyor…' : 'Tekrar dene' }}
            </button>
          </template>
          <DesignThemePicker v-else />
        </div>

        <DesignQrPanel class="order-5 mx-4 mt-10 mb-24 border-t border-rule pt-8 md:mx-8 lg:order-none lg:mx-0 lg:mb-0 lg:max-w-[720px]" />
      </div>
    </main>

    <AppToast />
  </div>
</template>

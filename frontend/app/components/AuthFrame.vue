<script setup lang="ts">
// Static specimen of the product: a fragment of the ruled adisyon sheet, as the owner will see it after a read.
const specimen = [
  {
    name: 'Çorbalar',
    items: [
      { name: 'Mercimek Çorbası', description: 'Limon ve kıtır ekmekle', price: '120', uncertain: false },
      { name: 'Ezogelin Çorbası', description: null, price: '120', uncertain: false },
      { name: 'İşkembe Çorbası', description: null, price: null, uncertain: true },
    ],
  },
  {
    name: 'Kebaplar',
    items: [
      { name: 'Adana Dürüm', description: 'Lavaş, közlenmiş biber, soğan', price: '260', uncertain: false },
      { name: 'Adana 1.5 Porsiyon', description: null, price: '390', uncertain: false },
    ],
  },
]
</script>

<template>
  <div class="min-h-dvh lg:grid lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]">
    <main class="px-4 pt-6 pb-12 md:px-8 lg:px-16">
      <p class="font-condensed text-wordmark text-graphite">
        Menüle
      </p>
      <div class="mt-12 max-w-[400px] lg:mt-24">
        <slot />
      </div>
    </main>

    <aside class="hidden bg-carbon px-16 pt-24 pb-16 lg:block" aria-hidden="true">
      <div class="max-w-[480px]">
        <div class="rounded-sheet bg-paper px-6 pt-6 pb-8">
          <section v-for="(category, ci) in specimen" :key="category.name" :class="ci > 0 && 'mt-8'">
            <h2 class="font-condensed text-h2 pb-3">
              {{ category.name }}
            </h2>
            <div class="border-y border-rule">
              <div
                v-for="(item, ii) in category.items"
                :key="item.name"
                class="grid min-h-14 grid-cols-[minmax(0,1fr)_96px]"
                :class="ii > 0 && 'border-t border-rule'"
              >
                <div
                  class="py-3 pr-3"
                  :class="item.uncertain ? 'border-l-[3px] border-marker-edge pl-[9px]' : 'pl-3'"
                >
                  <p class="text-item">
                    <span v-if="item.uncertain" class="marker marker-draw [animation-delay:700ms]">{{ item.name }}</span>
                    <template v-else>
                      {{ item.name }}
                    </template>
                    <span v-if="item.uncertain" class="ml-2 inline-block rounded-mark bg-marker px-1.5 align-[1px] text-small font-semibold">Kontrol et</span>
                  </p>
                  <p v-if="item.description" class="text-small text-graphite-2">
                    {{ item.description }}
                  </p>
                </div>
                <div class="flex items-start justify-end border-l border-rule py-3 pr-3 pl-2 text-item tabular-nums">
                  <span v-if="item.price">{{ item.price }}&nbsp;₺</span>
                  <span v-else class="marker block w-full rounded-mark px-2 text-right text-small leading-6 font-normal text-graphite-2">Fiyat</span>
                </div>
              </div>
            </div>
          </section>
        </div>
        <p class="measure mt-8 text-graphite">
          Kâğıt menünüzün fotoğrafını çekin. Ürünler buraya yazılır, emin olunmayanlar işaretlenir.
        </p>
      </div>
    </aside>
  </div>
</template>

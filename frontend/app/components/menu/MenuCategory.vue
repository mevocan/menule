<script setup lang="ts">
import type Category from '~/models/Category'

const props = defineProps<{
  category: Category
  index: number
  count: number
  categories: { id: number, name: string }[]
}>()

const menu = useMenuStore()
const headingId = computed(() => `cat-${props.category.id}`)
const editing = computed(() => menu.openKey === `cat:${props.category.id}`)
const adding = computed(() => menu.openKey === `add:${props.category.id}`)
</script>

<template>
  <section :aria-labelledby="`${headingId}-title`" class="scroll-mt-20">
    <MenuCategoryEditor
      v-if="editing"
      :category="category"
      :index="index"
      :count="count"
      :heading-id="headingId"
    />
    <h2 v-else :id="`${headingId}-title`" class="pb-2">
      <button
        :id="headingId"
        type="button"
        class="group -ml-1 inline-flex min-h-11 max-w-full items-center gap-2 rounded-control px-1 text-left font-condensed text-h2 hover:text-ink"
        aria-expanded="false"
        @click="menu.open(`cat:${category.id}`)"
      >
        <span class="min-w-0 break-words">{{ category.name }}</span>
        <MenuIcon name="pencil" class="text-graphite-2 group-hover:text-ink" />
        <span class="sr-only">, kategoriyi düzenle</span>
      </button>
    </h2>

    <ul class="divide-y divide-rule border-y border-rule">
      <MenuItemRow
        v-for="(item, i) in category.items"
        :key="item.id"
        :item="item"
        :index="i"
        :count="category.items.length"
        :categories="categories"
      />
      <li v-if="!category.items.length && !adding" class="grid min-h-14 grid-cols-[minmax(0,1fr)_104px]">
        <span class="py-4 pl-3 text-small text-graphite-2">Bu kategoride ürün yok.</span>
        <span class="border-l border-rule" />
      </li>
      <li>
        <MenuItemAdd v-if="adding" :category-id="category.id" />
        <button
          v-else
          :id="`add-btn-${category.id}`"
          type="button"
          class="group grid min-h-14 w-full grid-cols-[minmax(0,1fr)_104px] text-left hover:bg-carbon"
          @click="menu.open(`add:${category.id}`)"
        >
          <span class="flex items-center gap-2 pl-3 font-semibold text-ink group-hover:underline underline-offset-[0.2em]">
            <MenuIcon name="plus" />Ürün ekle
            <span class="sr-only">: {{ category.name }}</span>
          </span>
          <span class="border-l border-rule" />
        </button>
      </li>
    </ul>
  </section>
</template>

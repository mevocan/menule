<script setup lang="ts">
import type Item from '~/models/Item'

const props = defineProps<{
  item: Item
  index: number
  count: number
  categories: { id: number, name: string }[]
}>()

const menu = useMenuStore()
const rowId = computed(() => `item-${props.item.id}`)
const isOpen = computed(() => menu.openKey === `item:${props.item.id}`)

// Just arrived from a photo read: fade the row in, then draw the highlighter if it is uncertain.
const fresh = computed(() => menu.fresh[props.item.id])
const markStyle = computed(() => fresh.value?.mark != null ? { animationDelay: `${fresh.value.mark}ms` } : undefined)
</script>

<template>
  <li
    :class="fresh && 'row-in'"
    :style="fresh ? { animationDelay: `${fresh.row}ms` } : undefined"
  >
    <MenuItemEditor
      v-if="isOpen"
      :item="item"
      :index="index"
      :count="count"
      :categories="categories"
      :row-id="rowId"
    />
    <button
      v-else
      :id="rowId"
      type="button"
      class="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_104px] text-left hover:bg-carbon"
      aria-expanded="false"
      @click="menu.open(`item:${item.id}`)"
    >
      <span
        class="flex gap-3 py-3 pr-3"
        :class="item.uncertain ? 'border-l-[3px] border-marker-edge pl-[9px]' : 'pl-3'"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-item break-words">
            <span
              class="marker"
              :class="[!item.uncertain && 'marker-off', markStyle && 'marker-draw']"
              :style="markStyle"
            >{{ item.name }}</span>
            <span v-if="item.uncertain" class="tag-check ml-2 align-[1px]">Kontrol et</span>
          </span>
          <span v-if="item.description" class="mt-0.5 block text-small text-graphite-2 break-words">
            {{ item.description }}
          </span>
        </span>
        <img
          v-if="item.image_url"
          :src="item.image_url"
          alt=""
          class="size-12 shrink-0 rounded-control object-cover"
          loading="lazy"
        >
      </span>
      <span class="flex items-start justify-end border-l border-rule py-3 pr-3 pl-2 text-item tabular-nums">
        <span v-if="item.price !== null" class="whitespace-nowrap">{{ formatAmount(item.price) }}<span class="ml-[0.25em]">₺</span></span>
        <span
          v-else
          class="block w-full rounded-mark px-1 text-right text-small leading-6 text-graphite-2"
          :class="item.uncertain && ['marker', markStyle && 'marker-draw']"
          :style="markStyle"
        >Fiyat yok</span>
      </span>
    </button>
  </li>
</template>

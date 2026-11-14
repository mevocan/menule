<!--
  The public menu a diner opens from the QR code. Server-rendered, no auth, no app chrome:
  only the restaurant's chosen theme.
-->
<script setup lang="ts">
import type { PublicMenu } from '~/types/menu'

definePageMeta({ layout: false })

const route = useRoute()
const slug = String(route.params.slug)
const { apiBase } = useRuntimeConfig().public

const { data: menu, error } = await useAsyncData(`public-menu:${slug}`, async () => {
  const data = await $fetch<PublicMenu>(`/api/public/restaurants/${encodeURIComponent(slug)}`, {
    baseURL: apiBase,
    headers: { Accept: 'application/json' },
  })
  // Decimals can arrive as strings ("87.50"); themes work with numbers.
  for (const c of data.categories) {
    for (const i of c.items) i.price = i.price === null ? null : Number(i.price)
  }
  return data
})

if (error.value || !menu.value) {
  const notFound = error.value?.statusCode === 404 || !error.value
  throw createError({
    statusCode: notFound ? 404 : 503,
    statusMessage: notFound ? 'Menü bulunamadı' : 'Menü şu anda açılamıyor',
    fatal: true,
  })
}

const theme = themeInfo(menu.value.theme)
const names = menu.value.categories.map(c => c.name)
const description = names.length
  ? `${menu.value.name} menüsü: ${names.slice(0, 4).join(', ')}${names.length > 4 ? ' ve diğerleri' : ''}.`
  : `${menu.value.name} menüsü.`

useHead({
  title: menu.value.name,
  htmlAttrs: { style: `background:${theme.ground}` },
  meta: [{ name: 'theme-color', content: theme.ground }],
})
useSeoMeta({
  description,
  ogTitle: menu.value.name,
  ogDescription: description,
  ogType: 'website',
})
</script>

<template>
  <MenuTheme v-if="menu" :menu="menu" :theme="menu.theme" />
</template>

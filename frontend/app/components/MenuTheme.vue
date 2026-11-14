<!--
  Renders a menu in one of the three themes. Each theme is its own chunk, so /qr/[slug]
  loads only the chosen theme's code, styles and font.
-->
<script setup lang="ts">
import type { Component } from 'vue'
import type { PublicMenu, ThemeKey } from '~/types/menu'

const props = defineProps<{ menu: PublicMenu, theme: string | null, preview?: boolean }>()

const components: Record<ThemeKey, Component> = {
  klasik: defineAsyncComponent(() => import('~/components/themes/Klasik.vue')),
  modern: defineAsyncComponent(() => import('~/components/themes/Modern.vue')),
  sade: defineAsyncComponent(() => import('~/components/themes/Sade.vue')),
}

const component = computed(() => components[themeInfo(props.theme).key])
</script>

<template>
  <component :is="component" :menu="menu" :preview="preview" />
</template>

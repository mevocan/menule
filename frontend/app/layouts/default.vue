<!-- The owner app. Loads Archivo here, so the public menu pages (layout: false) load only their theme's font. -->
<script setup lang="ts">
useHead({
  link: [
    // Archivo variable: wdth 62–125 for the condensed headings. Google serves latin + latin-ext (ğ İ ş ₺).
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap' },
  ],
})
</script>

<template>
  <slot />
</template>

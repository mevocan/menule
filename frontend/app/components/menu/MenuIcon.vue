<script setup lang="ts">
defineProps<{ name: 'up' | 'down' | 'plus' | 'pencil' | 'image' }>()
</script>

<template>
  <svg class="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path v-if="name === 'up'" d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
    <path v-else-if="name === 'down'" d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
    <path v-else-if="name === 'plus'" d="M8 2.75v10.5M2.75 8h10.5" />
    <path v-else-if="name === 'pencil'" d="m10.5 2.5 3 3L6 13l-3.75.75L3 10z" />
    <template v-else>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="m2.5 11.5 3.5-3.5 3 3 1.5-1.5 3 3" />
      <circle cx="10.5" cy="6.25" r="1" />
    </template>
  </svg>
</template>

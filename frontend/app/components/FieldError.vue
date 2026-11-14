<script setup lang="ts">
defineProps<{ id: string, message: string }>()
</script>

<template>
  <p :id="id" role="alert" class="mt-1.5 flex gap-1.5 text-small text-redpen">
    <svg class="mt-0.5 size-4 shrink-0" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path d="M8 4.25v4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
      <circle cx="8" cy="11.4" r="1" fill="currentColor" />
    </svg>
    <span>{{ message }}</span>
  </p>
</template>

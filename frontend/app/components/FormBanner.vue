<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <p role="alert" class="rounded-sheet border-l-4 border-redpen bg-redpen-wash px-4 py-3 text-graphite">
    {{ message }}
  </p>
</template>

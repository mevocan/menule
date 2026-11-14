<script setup lang="ts">
const { toast } = useToast()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-4 bottom-4 z-20 flex justify-center md:inset-x-8 md:bottom-8 md:justify-start"
    role="status"
    aria-live="polite"
  >
    <p
      v-if="toast"
      :key="toast.id"
      class="pointer-events-auto rounded-control border border-line-strong bg-paper px-4 py-3 text-graphite shadow-pop"
    >
      {{ toast.text }}
    </p>
  </div>
</template>

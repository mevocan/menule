<script setup lang="ts">
defineOptions({ inheritAttrs: false })
// `marked`: highlighter fill, for a missing price the reader was unsure about.
defineProps<{ id: string, invalid?: boolean, describedby?: string, compact?: boolean, marked?: boolean }>()
const model = defineModel<string>({ required: true })

const input = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      ref="input"
      v-model="model"
      v-bind="$attrs"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      class="input text-right tabular-nums"
      :class="[compact ? 'pr-6 pl-2' : 'pr-8', marked && 'bg-marker']"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedby"
    >
    <span
      class="pointer-events-none absolute inset-y-0 flex items-center text-graphite-2"
      :class="compact ? 'right-2' : 'right-3'"
      aria-hidden="true"
    >₺</span>
  </div>
</template>

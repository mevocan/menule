<!--
  Reading the menu from photos. `prominent`: the empty-menu screen, where it stands next to
  the manual path as an equal. Otherwise it sits in the side column (above the sheet on mobile)
  and stays quiet until the owner picks photos.
-->
<script setup lang="ts">
import { MAX_PHOTOS } from '~/stores/menuImport'

const props = defineProps<{ prominent?: boolean }>()

const READING_NOTE = 'Bu biraz sürebilir, sayfadan çıkabilirsiniz.'

const imports = useMenuImportStore()
const menu = useMenuStore()

const uid = props.prominent ? 'photo-main' : 'photo-side'
const fileInput = ref<HTMLInputElement | null>(null)
const readButton = ref<HTMLButtonElement | null>(null)
const chooseButton = ref<HTMLButtonElement | null>(null)
const statusLine = ref<HTMLElement | null>(null)
const removeButtons = ref<HTMLButtonElement[]>([])
const dragging = ref(false)
onBeforeUpdate(() => (removeButtons.value = []))

const count = computed(() => imports.photos.length)
const left = computed(() => imports.quota?.remaining ?? MAX_PHOTOS)
const canAddMore = computed(() => !imports.busy && left.value > 0 && count.value < Math.min(MAX_PHOTOS, left.value))
const outOfQuota = computed(() => imports.quota?.remaining === 0)

/** Nothing picked, nothing running, nothing to report: the side column only offers the action. */
const quiet = computed(() => !props.prominent && !count.value && !imports.busy && !imports.error)

const progress = computed(() => {
  if (imports.sending === 'preparing') return 'Fotoğraflar hazırlanıyor…'
  if (imports.sending === 'uploading') return 'Fotoğraflar gönderiliyor…'
  if (imports.reading) return 'Menü okunuyor…'
  return ''
})

/** Announced once per change; errors announce themselves through their alert banner. */
const announcement = computed(() => {
  if (imports.reading) return `${progress.value} ${READING_NOTE}`
  if (progress.value) return progress.value
  const r = imports.result
  if (r) return doneText(r)
  return ''
})

function doneText(r: { summary: string, uncertain: number }) {
  return `${r.summary}${r.uncertain ? ` ${r.uncertain} tanesini kontrol edin.` : ''}`
}

function choose() {
  fileInput.value?.click()
}

async function picked(files: FileList | null | undefined) {
  if (!files?.length || imports.busy) return
  imports.add(files)
  await nextTick()
  if (readButton.value && !readButton.value.disabled) readButton.value.focus()
  else removeButtons.value.at(-1)?.focus()
}

async function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  await picked(input.files)
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  picked(event.dataTransfer?.files)
}

async function remove(key: number, index: number) {
  imports.remove(key)
  await nextTick()
  const next = removeButtons.value[Math.min(index, removeButtons.value.length - 1)]
  ;(next ?? chooseButton.value)?.focus()
}

async function read() {
  const run = imports.submit()
  await nextTick()
  statusLine.value?.focus()
  await run
}

/** The first uncertain item from this read, or any uncertain one if that was already checked. */
function goToUncertain() {
  const id = imports.result?.firstUncertain
  const target = menu.uncertainItems.find(i => i.id === id) ?? menu.uncertainItems[0]
  if (target) menu.revealItem(target.id)
}
</script>

<template>
  <section :aria-labelledby="`${uid}-title`" :class="!prominent && 'border-t border-rule pt-4'">
    <component
      :is="prominent ? 'h3' : 'h2'"
      :id="`${uid}-title`"
      :class="prominent ? 'text-item font-semibold' : 'text-label'"
    >
      {{ prominent ? 'Fotoğraftan oku' : 'Fotoğraftan ekle' }}
    </component>
    <p class="measure mt-1 text-small text-graphite-2">
      <template v-if="prominent">
        Ürünler ve fiyatlar fotoğraftan okunup buraya yazılır. Emin olunamayanlar sarıyla işaretlenir, siz kontrol edip düzeltirsiniz.
      </template>
      <template v-else>
        Menünüzün başka bir sayfası mı var? Okunan ürünler menünün sonuna eklenir, mevcut ürünler silinmez.
      </template>
    </p>

    <p class="sr-only" role="status">
      {{ announcement }}
    </p>

    <p v-if="imports.result && !imports.busy && !count" class="mt-3 text-small text-ink">
      <span class="font-semibold">{{ imports.result.summary }}</span>
      <template v-if="imports.result.uncertain && menu.uncertainItems.length">
        {{ ' ' }}<button type="button" class="font-semibold underline underline-offset-[0.2em] hover:text-ink-press" @click="goToUncertain">
          {{ imports.result.uncertain }} tanesini kontrol edin.
        </button>
      </template>
    </p>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      @change="onChange"
    >

    <!-- Quiet: one action and the quota. -->
    <div v-if="quiet" class="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <button
        ref="chooseButton"
        type="button"
        class="btn-secondary w-full md:w-auto lg:w-full"
        :disabled="outOfQuota"
        :aria-describedby="`${uid}-quota`"
        @click="choose"
      >
        Fotoğraf çek veya seç
      </button>
      <p v-if="outOfQuota" class="text-small text-graphite-2">
        Bu ayki {{ imports.quota?.limit }} fotoğraf hakkınız doldu. Hakkınız ayın 1'inde yenilenir.
      </p>
      <p v-if="imports.quota" :id="`${uid}-quota`" class="text-small text-graphite-2 tabular-nums">
        Bu ay kalan: {{ imports.quota.remaining }}/{{ imports.quota.limit }}
      </p>
    </div>

    <!-- The zone: carbon sheet with a dashed edge. Also a drop target on desktop. -->
    <div
      v-else
      class="mt-3 rounded-sheet border-[1.5px] border-dashed px-4 py-4"
      :class="dragging ? 'border-ink bg-ink-wash' : 'border-line-strong bg-carbon'"
      :aria-busy="imports.busy || undefined"
      @dragover.prevent="!imports.busy && (dragging = true)"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <FormBanner v-if="imports.error" class="mb-4 text-small" :message="imports.error" />

      <template v-if="count">
        <ol class="flex flex-wrap gap-3" :aria-label="`Okunacak fotoğraflar, ${count} tane`">
          <li v-for="(photo, i) in imports.photos" :key="photo.key" class="relative">
            <img
              :src="photo.url"
              :alt="`${i + 1}. fotoğraf`"
              class="size-16 rounded-control border border-rule bg-paper object-cover"
              :class="imports.busy && 'opacity-60'"
            >
            <span
              class="absolute bottom-1 left-1 min-w-5 rounded-mark bg-paper px-1 text-center text-small font-semibold tabular-nums"
              aria-hidden="true"
            >{{ i + 1 }}</span>
            <button
              v-if="!imports.busy"
              :ref="el => { if (el) removeButtons[i] = el as HTMLButtonElement }"
              type="button"
              class="absolute -top-2 -right-2 grid size-8 place-items-center rounded-control border border-line-strong bg-paper text-graphite hover:border-redpen hover:text-redpen"
              :aria-label="`${i + 1}. fotoğrafı kaldır`"
              @click="remove(photo.key, i)"
            >
              <svg class="size-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
                <path d="m3 3 8 8M11 3l-8 8" />
              </svg>
            </button>
          </li>
        </ol>
        <p v-if="count > 1 && !imports.busy" class="mt-2 text-small text-graphite-2">
          Fotoğraflar bu sırayla okunur.
        </p>
      </template>

      <!-- Running: the zone becomes a status line. No progress bar; there is no real progress to show. -->
      <p
        v-if="progress"
        ref="statusLine"
        tabindex="-1"
        class="measure flex gap-2.5 focus:outline-none"
        :class="count ? 'mt-4' : ''"
      >
        <span class="reading-pen mt-[0.66rem] shrink-0" aria-hidden="true" />
        <span>
          <span class="block font-semibold">{{ progress }}</span>
          <span v-if="imports.reading" class="block text-small text-graphite-2">{{ READING_NOTE }}</span>
        </span>
      </p>

      <template v-else>
        <FieldError v-if="count && imports.selectionProblem" :id="`${uid}-problem`" class="mt-3" :message="imports.selectionProblem" />
        <p v-else-if="!count && outOfQuota" class="text-small">
          {{ imports.selectionProblem }}
        </p>
        <p v-else-if="!count" :id="`${uid}-hint`" class="measure text-small text-graphite-2">
          En fazla {{ MAX_PHOTOS }} fotoğraf. Menünün tamamı görünsün, yazılar net olsun.
          <span class="hidden lg:inline">Fotoğrafları buraya sürükleyebilirsiniz.</span>
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            v-if="count"
            ref="readButton"
            type="button"
            class="btn-primary w-full md:w-auto"
            :disabled="!!imports.selectionProblem"
            :aria-describedby="imports.selectionProblem ? `${uid}-problem` : undefined"
            @click="read"
          >
            {{ imports.error ? 'Tekrar oku' : 'Menüyü oku' }} ({{ count }} fotoğraf)
          </button>
          <button
            v-if="count"
            ref="chooseButton"
            type="button"
            class="btn-text"
            :disabled="!canAddMore"
            @click="choose"
          >
            Fotoğraf ekle
          </button>
          <button
            v-else
            ref="chooseButton"
            type="button"
            class="btn-primary w-full md:w-auto"
            :disabled="outOfQuota"
            :aria-describedby="outOfQuota ? undefined : `${uid}-hint`"
            @click="choose"
          >
            Fotoğraf çek veya seç
          </button>
        </div>
      </template>

      <p v-if="imports.quota" class="mt-3 text-right text-small text-graphite-2 tabular-nums">
        Bu ay kalan: {{ imports.quota.remaining }}/{{ imports.quota.limit }}
      </p>
    </div>
  </section>
</template>

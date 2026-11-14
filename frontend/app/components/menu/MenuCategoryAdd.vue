<script setup lang="ts">
import type { FormErrors } from '~/composables/useApi'

// `first`: the empty-menu form, always open. Otherwise a "Kategori ekle" button at the end of the sheet.
const props = defineProps<{ first?: boolean }>()

const menu = useMenuStore()
const uid = props.first ? 'first-category' : 'new-category'
const isOpen = computed(() => props.first || menu.openKey === 'newcat')
const name = ref('')
const errors = ref<FormErrors>({ message: '', fields: {} })
const saving = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

watch(isOpen, async (open) => {
  if (open && !props.first) {
    await nextTick()
    nameInput.value?.focus()
  }
})

function cancel() {
  name.value = ''
  errors.value = { message: '', fields: {} }
  menu.close('new-category-btn')
}

async function add() {
  errors.value = { message: '', fields: {} }
  if (!name.value.trim()) {
    errors.value.fields.name = 'Kategori adını yazın. Örnek: Çorbalar'
    nameInput.value?.focus()
    return
  }
  saving.value = true
  try {
    const category = await menu.addCategory(name.value.trim())
    name.value = ''
    // Straight on to its first item.
    if (props.first || menu.openKey === 'newcat') menu.open(`add:${category.id}`)
  }
  catch (error) {
    errors.value = toFormErrors(error)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <form
      v-if="isOpen"
      :class="!first && 'rounded-sheet bg-ink-wash px-3 py-4'"
      novalidate
      @submit.prevent="add"
      @keydown.esc="!first && cancel()"
    >
      <FormBanner v-if="errors.message" class="mb-5" :message="errors.message" />
      <label :for="`${uid}-name`" class="label">{{ first ? 'İlk kategorinin adı' : 'Kategori adı' }}</label>
      <input
        :id="`${uid}-name`"
        ref="nameInput"
        v-model="name"
        type="text"
        class="input md:max-w-96"
        autocomplete="off"
        :aria-invalid="!!errors.fields.name || undefined"
        :aria-describedby="errors.fields.name ? `${uid}-name-error` : `${uid}-help`"
      >
      <FieldError v-if="errors.fields.name" :id="`${uid}-name-error`" :message="errors.fields.name" />
      <p v-else :id="`${uid}-help`" class="mt-1.5 text-small text-graphite-2">
        Örnek: Çorbalar, Kebaplar, İçecekler
      </p>
      <div class="mt-4 flex items-center gap-4">
        <button type="submit" class="btn-primary flex-1 md:flex-none" :disabled="saving">
          {{ saving ? 'Ekleniyor…' : 'Kategori ekle' }}
        </button>
        <button v-if="!first" type="button" class="btn-text px-2" @click="cancel">
          Vazgeç
        </button>
      </div>
    </form>
    <button
      v-else
      id="new-category-btn"
      type="button"
      class="btn-text gap-2"
      @click="menu.open('newcat')"
    >
      <MenuIcon name="plus" />Kategori ekle
    </button>
  </div>
</template>

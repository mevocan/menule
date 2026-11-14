<script setup lang="ts">
import type { FormErrors } from '~/composables/useApi'

// Quick add at the end of a category: name and price on the sheet's own columns.
// Enter saves and keeps the fields open for the next item.
const props = defineProps<{ categoryId: number }>()

const menu = useMenuStore()
const uid = `add-${props.categoryId}`
const name = ref('')
const price = ref('')
const errors = ref<FormErrors>({ message: '', fields: {} })
const saving = ref(false)
const announced = ref('')
const nameInput = ref<HTMLInputElement | null>(null)
const priceInput = ref<{ focus: () => void } | null>(null)

onMounted(() => nameInput.value?.focus())

function close() {
  menu.close(`add-btn-${props.categoryId}`)
}

async function add() {
  errors.value = { message: '', fields: {} }
  const parsed = parsePrice(price.value)
  if (!name.value.trim()) {
    errors.value.fields.name = 'Ürün adını yazın.'
    nameInput.value?.focus()
    return
  }
  if (parsed === undefined) {
    errors.value.fields.price = PRICE_ERROR
    priceInput.value?.focus()
    return
  }

  saving.value = true
  try {
    const item = await menu.addItem(props.categoryId, { name: name.value.trim(), price: parsed })
    announced.value = `${item.name} eklendi.`
    name.value = ''
    price.value = ''
    nameInput.value?.focus()
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
  <form
    class="grid grid-cols-[minmax(0,1fr)_104px] bg-ink-wash"
    aria-label="Ürün ekle"
    novalidate
    @submit.prevent="add"
    @keydown.esc.stop="close"
  >
    <div class="pt-3 pr-3 pl-3">
      <label :for="`${uid}-name`" class="label">Ürün adı</label>
      <input
        :id="`${uid}-name`"
        ref="nameInput"
        v-model="name"
        type="text"
        class="input"
        autocomplete="off"
        enterkeyhint="done"
        :aria-invalid="!!errors.fields.name || undefined"
        :aria-describedby="errors.fields.name ? `${uid}-name-error` : `${uid}-help`"
      >
    </div>
    <div class="border-l border-rule pt-3 pr-3 pl-2">
      <label :for="`${uid}-price`" class="label">Fiyat</label>
      <MenuPriceInput
        :id="`${uid}-price`"
        ref="priceInput"
        v-model="price"
        compact
        enterkeyhint="done"
        :invalid="!!errors.fields.price"
        :describedby="errors.fields.price ? `${uid}-price-error` : `${uid}-help`"
      />
    </div>

    <div class="col-span-2 px-3 pb-3">
      <FieldError v-if="errors.fields.name" :id="`${uid}-name-error`" :message="errors.fields.name" />
      <FieldError v-if="errors.fields.price" :id="`${uid}-price-error`" :message="errors.fields.price" />
      <FormBanner v-if="errors.message" class="mt-3" :message="errors.message" />
      <p :id="`${uid}-help`" class="mt-1.5 text-small text-graphite-2">
        Enter ile ekleyin, sıradaki ürün için alanlar açık kalır.
      </p>
      <div class="mt-3 flex items-center gap-4">
        <button type="submit" class="btn-primary flex-1 md:flex-none" :disabled="saving">
          {{ saving ? 'Ekleniyor…' : 'Ekle' }}
        </button>
        <button type="button" class="btn-text px-2" @click="close">
          Kapat
        </button>
      </div>
      <p class="sr-only" aria-live="polite">
        {{ announced }}
      </p>
    </div>
  </form>
</template>

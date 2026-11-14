<script setup lang="ts">
import type Category from '~/models/Category'
import type { FormErrors } from '~/composables/useApi'

const props = defineProps<{
  category: Category
  index: number
  count: number
  headingId: string
}>()

const menu = useMenuStore()
const { show } = useToast()

const uid = `${props.headingId}-edit`
const name = ref(props.category.name)
const errors = ref<FormErrors>({ message: '', fields: {} })
const busy = ref<'save' | 'up' | 'down' | 'delete' | null>(null)
const confirming = ref(false)

const nameInput = ref<HTMLInputElement | null>(null)
const upButton = ref<HTMLButtonElement | null>(null)
const downButton = ref<HTMLButtonElement | null>(null)
const confirmCancel = ref<HTMLButtonElement | null>(null)

const itemCount = computed(() => props.category.items.length)

onMounted(() => nameInput.value?.select())

function cancel() {
  menu.close(props.headingId)
}

async function save() {
  errors.value = { message: '', fields: {} }
  if (!name.value.trim()) {
    errors.value.fields.name = 'Kategori adını yazın.'
    nameInput.value?.focus()
    return
  }
  busy.value = 'save'
  try {
    await menu.renameCategory(props.category.id, name.value.trim())
    menu.close(props.headingId, `cat:${props.category.id}`)
    show('Kaydedildi')
  }
  catch (error) {
    errors.value = toFormErrors(error)
  }
  finally {
    busy.value = null
  }
}

async function move(delta: -1 | 1) {
  errors.value = { message: '', fields: {} }
  busy.value = delta < 0 ? 'up' : 'down'
  try {
    await menu.moveCategory(props.category.id, delta)
  }
  catch (error) {
    errors.value = toFormErrors(error)
  }
  finally {
    busy.value = null
  }
  await nextTick()
  const [same, other] = delta < 0 ? [upButton.value, downButton.value] : [downButton.value, upButton.value]
  ;(same && !same.disabled ? same : other)?.focus()
  same?.closest('section')?.scrollIntoView({ block: 'nearest' })
}

async function ask() {
  confirming.value = true
  await nextTick()
  confirmCancel.value?.focus()
}

async function remove() {
  busy.value = 'delete'
  try {
    await menu.deleteCategory(props.category.id)
    menu.close(undefined, `cat:${props.category.id}`)
    show('Kategori silindi')
  }
  catch (error) {
    confirming.value = false
    busy.value = null
    errors.value = toFormErrors(error)
  }
}
</script>

<template>
  <form
    class="mb-3 rounded-sheet bg-ink-wash px-3 py-4"
    aria-label="Kategoriyi düzenle"
    novalidate
    @submit.prevent="save"
    @keydown.esc.stop="cancel"
  >
    <FormBanner v-if="errors.message" class="mb-5" :message="errors.message" />

    <label :for="`${uid}-name`" class="label">Kategori adı</label>
    <input
      :id="`${uid}-name`"
      ref="nameInput"
      v-model="name"
      type="text"
      class="input font-condensed text-h2"
      autocomplete="off"
      :aria-invalid="!!errors.fields.name || undefined"
      :aria-describedby="errors.fields.name ? `${uid}-name-error` : undefined"
    >
    <FieldError v-if="errors.fields.name" :id="`${uid}-name-error`" :message="errors.fields.name" />

    <div class="mt-4 flex items-center gap-4">
      <button type="submit" class="btn-primary flex-1 md:flex-none" :disabled="busy !== null">
        {{ busy === 'save' ? 'Kaydediliyor…' : 'Kaydet' }}
      </button>
      <button type="button" class="btn-text px-2" @click="cancel">
        Vazgeç
      </button>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-x-5 border-t border-rule pt-1">
      <template v-if="confirming">
        <span class="basis-full pt-2 font-semibold sm:basis-auto sm:pt-0">
          <template v-if="itemCount">{{ category.name }} ve içindeki {{ itemCount }} ürün silinsin mi?</template>
          <template v-else>{{ category.name }} silinsin mi?</template>
        </span>
        <button type="button" class="btn-text text-redpen" :disabled="busy !== null" @click="remove">
          {{ busy === 'delete' ? 'Siliniyor…' : 'Sil' }}
        </button>
        <button ref="confirmCancel" type="button" class="btn-text" :disabled="busy !== null" @click="confirming = false">
          Vazgeç
        </button>
      </template>
      <template v-else>
        <button ref="upButton" type="button" class="btn-text gap-1.5" :disabled="index === 0 || busy !== null" @click="move(-1)">
          <MenuIcon name="up" />Yukarı taşı
        </button>
        <button ref="downButton" type="button" class="btn-text gap-1.5" :disabled="index === count - 1 || busy !== null" @click="move(1)">
          <MenuIcon name="down" />Aşağı taşı
        </button>
        <button type="button" class="btn-text ml-auto text-redpen" :disabled="busy !== null" @click="ask">
          Kategoriyi sil
        </button>
      </template>
    </div>
  </form>
</template>

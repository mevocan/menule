<script setup lang="ts">
import type Item from '~/models/Item'
import type { FormErrors } from '~/composables/useApi'
import type { ItemInput } from '~/stores/menu'

const props = defineProps<{
  item: Item
  index: number
  count: number
  categories: { id: number, name: string }[]
  rowId: string
}>()

const menu = useMenuStore()
const { show } = useToast()

const uid = `item-${props.item.id}-edit`
const name = ref(props.item.name)
const description = ref(props.item.description ?? '')
const price = ref(props.item.price === null ? '' : formatAmount(props.item.price))
const categoryId = ref(props.item.category_id)

const noErrors = (): FormErrors => ({ message: '', fields: {} })
const errors = ref<FormErrors>(noErrors())
const imageError = ref('')

type Busy = 'save' | 'confirm' | 'up' | 'down' | 'delete' | 'image' | 'remove-image'
const busy = ref<Busy | null>(null)
const confirming = ref<'delete' | 'remove-image' | null>(null)

const nameInput = ref<HTMLInputElement | null>(null)
const priceInput = ref<{ focus: () => void } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const upButton = ref<HTMLButtonElement | null>(null)
const downButton = ref<HTMLButtonElement | null>(null)
const confirmCancel = ref<HTMLButtonElement | null>(null)

/** Inline confirmation in place of the button; focus lands on the safe choice. */
async function ask(what: 'delete' | 'remove-image') {
  confirming.value = what
  await nextTick()
  confirmCancel.value?.focus()
}

onMounted(() => nameInput.value?.focus())

function fail(error: unknown) {
  errors.value = toFormErrors(error)
}

function cancel() {
  menu.close(props.rowId)
}

async function save() {
  errors.value = noErrors()
  const parsed = parsePrice(price.value)
  const fields: Record<string, string> = {}
  if (!name.value.trim()) fields.name = 'Ürün adını yazın.'
  if (parsed === undefined) fields.price = PRICE_ERROR
  if (Object.keys(fields).length) {
    errors.value = { message: '', fields }
    if (fields.name) nameInput.value?.focus()
    else priceInput.value?.focus()
    return
  }

  const body: ItemInput = {
    name: name.value.trim(),
    description: description.value.trim() || null,
    price: parsed ?? null,
  }
  // Saving an item the reader was unsure about means the owner has checked it.
  if (props.item.uncertain) body.uncertain = false
  const target = props.categories.find(c => c.id === categoryId.value)
  const moving = categoryId.value !== props.item.category_id
  if (moving) body.category_id = categoryId.value

  busy.value = 'save'
  try {
    await menu.updateItem(props.item.id, body)
    menu.close(props.rowId, `item:${props.item.id}`)
    show(moving && target ? `${target.name} kategorisine taşındı` : 'Kaydedildi')
  }
  catch (error) {
    fail(error)
  }
  finally {
    busy.value = null
  }
}

async function confirmCorrect() {
  errors.value = noErrors()
  busy.value = 'confirm'
  try {
    await menu.updateItem(props.item.id, { uncertain: false })
    menu.close(props.rowId, `item:${props.item.id}`)
  }
  catch (error) {
    fail(error)
  }
  finally {
    busy.value = null
  }
}

async function move(delta: -1 | 1) {
  errors.value = noErrors()
  busy.value = delta < 0 ? 'up' : 'down'
  try {
    await menu.moveItem(props.item.id, delta)
  }
  catch (error) {
    fail(error)
  }
  finally {
    busy.value = null
  }
  // The row moved in the DOM, which drops focus. Put it back on the same button, or the other one at an end.
  await nextTick()
  const [same, other] = delta < 0 ? [upButton.value, downButton.value] : [downButton.value, upButton.value]
  ;(same && !same.disabled ? same : other)?.focus()
}

async function remove() {
  errors.value = noErrors()
  busy.value = 'delete'
  try {
    await menu.deleteItem(props.item.id)
    menu.close(`add-btn-${props.item.category_id}`, `item:${props.item.id}`)
    show('Ürün silindi')
  }
  catch (error) {
    confirming.value = null
    busy.value = null
    fail(error)
  }
}

async function pickImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  imageError.value = ''
  busy.value = 'image'
  try {
    let image: Blob
    try {
      image = await resizeImage(file)
    }
    catch {
      imageError.value = 'Bu dosya açılamadı. JPG, PNG veya WEBP bir fotoğraf seçin.'
      return
    }
    await menu.uploadImage(props.item.id, image)
  }
  catch (error) {
    const e = toFormErrors(error)
    imageError.value = e.fields.image ?? e.message
  }
  finally {
    busy.value = null
  }
}

async function removeImage() {
  imageError.value = ''
  busy.value = 'remove-image'
  try {
    await menu.removeImage(props.item.id)
  }
  catch (error) {
    imageError.value = toFormErrors(error).message
  }
  finally {
    busy.value = null
    confirming.value = null
  }
}

const describe = (field: string, helper?: string) =>
  [errors.value.fields[field] && `${uid}-${field}-error`, helper].filter(Boolean).join(' ') || undefined
</script>

<template>
  <form
    class="bg-ink-wash py-4 pr-3"
    :class="item.uncertain ? 'border-l-[3px] border-marker-edge pl-[9px]' : 'pl-3'"
    :aria-label="`${item.name} düzenleniyor`"
    novalidate
    @submit.prevent="save"
    @keydown.esc.stop="cancel"
  >
    <div v-if="item.uncertain" class="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
      <p class="measure flex-1 basis-56 text-small">
        <span class="tag-check mr-1.5">Kontrol et</span>
        Bu ürün emin olunmadan okundu. Doğruysa onaylayın, yanlışsa düzeltip kaydedin.
      </p>
      <button type="button" class="btn-secondary" :disabled="busy !== null" @click="confirmCorrect">
        {{ busy === 'confirm' ? 'Onaylanıyor…' : 'Doğru' }}
      </button>
    </div>

    <FormBanner v-if="errors.message" class="mb-5" :message="errors.message" />

    <div class="grid gap-5 md:grid-cols-2">
      <div class="md:col-span-2">
        <label :for="`${uid}-name`" class="label">Ürün adı</label>
        <input
          :id="`${uid}-name`"
          ref="nameInput"
          v-model="name"
          type="text"
          class="input"
          autocomplete="off"
          :aria-invalid="!!errors.fields.name || undefined"
          :aria-describedby="describe('name')"
        >
        <FieldError v-if="errors.fields.name" :id="`${uid}-name-error`" :message="errors.fields.name" />
      </div>

      <div class="md:col-span-2">
        <label :for="`${uid}-description`" class="label">Açıklama <span class="font-normal text-graphite-2">(isteğe bağlı)</span></label>
        <textarea
          :id="`${uid}-description`"
          v-model="description"
          rows="2"
          class="input h-auto min-h-12 py-3"
          :aria-invalid="!!errors.fields.description || undefined"
          :aria-describedby="describe('description')"
        />
        <FieldError v-if="errors.fields.description" :id="`${uid}-description-error`" :message="errors.fields.description" />
      </div>

      <div>
        <label :for="`${uid}-price`" class="label">Fiyat</label>
        <div class="max-w-48">
          <MenuPriceInput
            :id="`${uid}-price`"
            ref="priceInput"
            v-model="price"
            :invalid="!!errors.fields.price"
            :describedby="describe('price', `${uid}-price-help`)"
            :marked="item.uncertain && !price.trim()"
          />
        </div>
        <FieldError v-if="errors.fields.price" :id="`${uid}-price-error`" :message="errors.fields.price" />
        <p :id="`${uid}-price-help`" class="mt-1.5 text-small text-graphite-2">
          Fiyat yoksa boş bırakın.
        </p>
      </div>

      <div v-if="categories.length > 1">
        <label :for="`${uid}-category`" class="label">Kategori</label>
        <select
          :id="`${uid}-category`"
          v-model="categoryId"
          class="input"
          :aria-invalid="!!errors.fields.category_id || undefined"
          :aria-describedby="describe('category_id', `${uid}-category-help`)"
        >
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
        <FieldError v-if="errors.fields.category_id" :id="`${uid}-category_id-error`" :message="errors.fields.category_id" />
        <p :id="`${uid}-category-help`" class="mt-1.5 text-small text-graphite-2">
          Başka kategoriye taşınan ürün oranın sonuna eklenir.
        </p>
      </div>

      <div class="md:col-span-2">
        <p :id="`${uid}-image-label`" class="label">
          Görsel <span class="font-normal text-graphite-2">(isteğe bağlı)</span>
        </p>
        <div class="flex items-center gap-4">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="`${item.name} görseli`"
            class="size-20 shrink-0 rounded-control object-cover"
          >
          <div v-if="confirming === 'remove-image'" class="flex flex-wrap items-center gap-x-4">
            <span class="font-semibold">Görsel kaldırılsın mı?</span>
            <button type="button" class="btn-text text-redpen" :disabled="busy !== null" @click="removeImage">
              {{ busy === 'remove-image' ? 'Kaldırılıyor…' : 'Kaldır' }}
            </button>
            <button ref="confirmCancel" type="button" class="btn-text" :disabled="busy !== null" @click="confirming = null">
              Vazgeç
            </button>
          </div>
          <div v-else class="flex flex-wrap items-center gap-x-5">
            <button
              type="button"
              class="btn-text gap-2"
              :aria-describedby="`${uid}-image-label`"
              :disabled="busy !== null"
              @click="fileInput?.click()"
            >
              <MenuIcon name="image" />
              <template v-if="busy === 'image'">
                Görsel yükleniyor…
              </template>
              <template v-else>
                {{ item.image_url ? 'Görseli değiştir' : 'Görsel ekle' }}
              </template>
            </button>
            <button
              v-if="item.image_url"
              type="button"
              class="btn-text text-redpen"
              :disabled="busy !== null"
              @click="ask('remove-image')"
            >
              Görseli kaldır
            </button>
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="sr-only"
          tabindex="-1"
          aria-hidden="true"
          @change="pickImage"
        >
        <FieldError v-if="imageError" :id="`${uid}-image-error`" :message="imageError" />
      </div>
    </div>

    <div class="mt-6 flex items-center gap-4">
      <button type="submit" class="btn-primary flex-1 md:flex-none" :disabled="busy !== null">
        {{ busy === 'save' ? 'Kaydediliyor…' : 'Kaydet' }}
      </button>
      <button type="button" class="btn-text px-2" @click="cancel">
        Vazgeç
      </button>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-x-5 border-t border-rule pt-1">
      <template v-if="confirming === 'delete'">
        <span class="font-semibold">Bu ürün silinsin mi?</span>
        <button type="button" class="btn-text text-redpen" :disabled="busy !== null" @click="remove">
          {{ busy === 'delete' ? 'Siliniyor…' : 'Sil' }}
        </button>
        <button ref="confirmCancel" type="button" class="btn-text" :disabled="busy !== null" @click="confirming = null">
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
        <button type="button" class="btn-text ml-auto text-redpen" :disabled="busy !== null" @click="ask('delete')">
          Ürünü sil
        </button>
      </template>
    </div>
  </form>
</template>

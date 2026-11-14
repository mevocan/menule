<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
useHead({ title: 'Kayıt ol · Menüle' })

const auth = useAuthStore()

const form = reactive({
  name: '',
  restaurant_name: '',
  email: '',
  password: '',
  password_confirmation: '',
})
const errors = ref<FormErrors>({ message: '', fields: {} })
const pending = ref(false)

const fields = [
  { key: 'restaurant_name', label: 'Restoran adı', type: 'text', autocomplete: 'organization' },
  { key: 'name', label: 'Adınız soyadınız', type: 'text', autocomplete: 'name' },
  { key: 'email', label: 'E-posta', type: 'email', autocomplete: 'email' },
  { key: 'password', label: 'Şifre', type: 'password', autocomplete: 'new-password' },
  { key: 'password_confirmation', label: 'Şifre tekrar', type: 'password', autocomplete: 'new-password' },
] as const

const host = useRequestURL().host
const slug = computed(() => slugPreview(form.restaurant_name))

const helpers: Partial<Record<(typeof fields)[number]['key'], () => string>> = {
  restaurant_name: () => `Menü adresiniz: ${host}/qr/${slug.value || 'restoran-adiniz'}`,
  password: () => 'En az 8 karakter.',
}

const shown = reactive<Record<string, boolean>>({})

function describedBy(key: string) {
  const ids = []
  if (key in helpers) ids.push(`${key}-help`)
  if (errors.value.fields[key]) ids.push(`${key}-error`)
  return ids.length ? ids.join(' ') : undefined
}

async function submit() {
  pending.value = true
  errors.value = { message: '', fields: {} }
  try {
    await auth.register({ ...form })
    await navigateTo('/panel')
  }
  catch (e) {
    errors.value = toFormErrors(e)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthFrame>
    <h1 class="font-condensed text-h1 lg:text-display">
      Menünüzü internete taşıyın
    </h1>

    <form class="mt-8 flex flex-col gap-5" novalidate @submit.prevent="submit">
      <FormBanner v-if="errors.message" :message="errors.message" />

      <div v-for="field in fields" :key="field.key">
        <label class="label" :for="field.key">{{ field.label }}</label>
        <div class="relative">
          <input
            :id="field.key"
            v-model="form[field.key]"
            class="input"
            :class="field.type === 'password' && 'pr-20'"
            :type="field.type === 'password' && shown[field.key] ? 'text' : field.type"
            :name="field.key"
            :autocomplete="field.autocomplete"
            required
            :aria-invalid="!!errors.fields[field.key]"
            :aria-describedby="describedBy(field.key)"
          >
          <button
            v-if="field.type === 'password'"
            type="button"
            class="btn-text absolute inset-y-0.5 right-0.5 rounded-control px-3"
            :aria-controls="field.key"
            @click="shown[field.key] = !shown[field.key]"
          >
            {{ shown[field.key] ? 'Gizle' : 'Göster' }}
          </button>
        </div>
        <p v-if="helpers[field.key]" :id="`${field.key}-help`" class="mt-1.5 text-small text-graphite-2 break-words">
          {{ helpers[field.key]!() }}
        </p>
        <FieldError v-if="errors.fields[field.key]" :id="`${field.key}-error`" :message="errors.fields[field.key]!" />
      </div>

      <button type="submit" class="btn-primary mt-1 w-full md:w-auto md:self-start" :disabled="pending">
        <span class="grid">
          <span class="[grid-area:1/1]" :class="pending && 'invisible'">Hesap oluştur</span>
          <span class="[grid-area:1/1]" :class="!pending && 'invisible'">Hesap oluşturuluyor…</span>
        </span>
      </button>
    </form>

    <p class="mt-8">
      Zaten hesabınız var mı?
      <NuxtLink to="/giris" class="btn-text">Giriş yapın</NuxtLink>
    </p>
  </AuthFrame>
</template>

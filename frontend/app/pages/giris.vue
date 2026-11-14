<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
useHead({ title: 'Giriş yap · Menüle' })

const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const errors = ref<FormErrors>({ message: '', fields: {} })
const pending = ref(false)
const showPassword = ref(false)

async function submit() {
  pending.value = true
  errors.value = { message: '', fields: {} }
  try {
    await auth.login(form.email, form.password)
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
      Giriş yap
    </h1>

    <form class="mt-8 flex flex-col gap-5" novalidate @submit.prevent="submit">
      <FormBanner v-if="errors.message" :message="errors.message" />

      <div>
        <label class="label" for="email">E-posta</label>
        <input
          id="email"
          v-model="form.email"
          class="input"
          type="email"
          name="email"
          autocomplete="email"
          required
          :aria-invalid="!!errors.fields.email"
          :aria-describedby="errors.fields.email ? 'email-error' : undefined"
        >
        <FieldError v-if="errors.fields.email" id="email-error" :message="errors.fields.email" />
      </div>

      <div>
        <label class="label" for="password">Şifre</label>
        <div class="relative">
          <input
            id="password"
            v-model="form.password"
            class="input pr-20"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            autocomplete="current-password"
            required
            :aria-invalid="!!errors.fields.password"
            :aria-describedby="errors.fields.password ? 'password-error' : undefined"
          >
          <button
            type="button"
            class="btn-text absolute inset-y-0.5 right-0.5 rounded-control px-3"
            aria-controls="password"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Gizle' : 'Göster' }}
          </button>
        </div>
        <FieldError v-if="errors.fields.password" id="password-error" :message="errors.fields.password" />
      </div>

      <button type="submit" class="btn-primary mt-1 w-full md:w-auto md:self-start" :disabled="pending">
        <span class="grid">
          <span class="[grid-area:1/1]" :class="pending && 'invisible'">Giriş yap</span>
          <span class="[grid-area:1/1]" :class="!pending && 'invisible'">Giriş yapılıyor…</span>
        </span>
      </button>
    </form>

    <p class="mt-8">
      Hesabınız yok mu?
      <NuxtLink to="/kayit" class="btn-text">Kayıt olun</NuxtLink>
    </p>
  </AuthFrame>
</template>

<!--
  Nuxt error page. Diners land here from an old or unpublished QR code, so it uses the system
  font (no extra download) and says what happened in plain Turkish.
-->
<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const route = useRoute()
const isMenu = computed(() => route.path.startsWith('/qr/'))
const notFound = computed(() => props.error.statusCode === 404)

const title = computed(() => {
  if (notFound.value) return isMenu.value ? 'Menü bulunamadı' : 'Sayfa bulunamadı'
  return isMenu.value ? 'Menü şu anda açılamıyor' : 'Bir sorun oluştu'
})

const body = computed(() => {
  if (notFound.value && isMenu.value) return 'Bu adreste yayında bir menü yok. Adres yanlış yazılmış ya da menü yayından kaldırılmış olabilir. Menüyü görmek için işletmeye sorabilirsiniz.'
  if (notFound.value) return 'Aradığınız sayfa burada değil. Adresi kontrol edin.'
  return 'Birkaç dakika sonra sayfayı yenileyip tekrar deneyin.'
})

useHead({ title })
</script>

<template>
  <main class="error-page">
    <p class="code" aria-hidden="true">
      {{ error.statusCode }}
    </p>
    <h1>{{ title }}</h1>
    <p class="body">
      {{ body }}
    </p>
    <button v-if="!notFound" type="button" class="retry" @click="clearError({ redirect: route.fullPath })">
      Sayfayı yenile
    </button>
  </main>
</template>

<style scoped>
.error-page {
  max-width: 30rem;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 72px 24px;
  color: #26292E;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.code {
  color: #5F6670;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

h1 {
  margin-top: 8px;
  font-size: 1.75rem;
  line-height: 1.2;
  font-weight: 700;
}

.body {
  margin-top: 12px;
  color: #5F6670;
  font-size: 1.0625rem;
  line-height: 1.55;
}

.retry {
  margin-top: 24px;
  min-height: 48px;
  padding: 0 20px;
  border: 1.5px solid #26292E;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
</style>

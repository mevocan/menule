<!-- Owner app top bar: wordmark, Menü / Tasarım, Çıkış yap. On mobile the two pages sit in a tab row below. -->
<script setup lang="ts">
const auth = useAuthStore()
const pending = ref(false)

const links = [
  { to: '/panel', label: 'Menü' },
  { to: '/panel/tasarim', label: 'Tasarım' },
]

async function logout() {
  pending.value = true
  try {
    await auth.logout()
    await navigateTo('/giris')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-rule bg-paper">
    <div class="flex h-14 items-center gap-8 px-4 md:px-8">
      <NuxtLink to="/panel" class="font-condensed text-wordmark">
        Menüle
      </NuxtLink>
      <nav aria-label="Panel" class="hidden h-full md:block">
        <ul class="flex h-full gap-6">
          <li v-for="link in links" :key="link.to" class="h-full">
            <NuxtLink
              :to="link.to"
              class="flex h-full items-center border-b-2 border-transparent pt-0.5 font-semibold text-graphite-2 hover:text-graphite aria-[current=page]:border-ink aria-[current=page]:text-graphite"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <button type="button" class="btn-text ml-auto" :disabled="pending" @click="logout">
        {{ pending ? 'Çıkış yapılıyor…' : 'Çıkış yap' }}
      </button>
    </div>
    <nav aria-label="Panel" class="border-t border-rule md:hidden">
      <ul class="grid h-11 grid-cols-2">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="flex h-full items-center justify-center border-b-2 border-transparent pt-0.5 font-semibold text-graphite-2 aria-[current=page]:border-ink aria-[current=page]:text-graphite"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

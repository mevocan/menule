<!--
  Akşam (key `sade`). A fine-dining card for a dim room: petrol ground, everything centred, one quiet
  geometric face. Item photos (and the logo) sit on round plates. Categories open from a floating pill.
  See .claude/design/themes.md.
-->
<script setup lang="ts">
import type { PublicMenu } from '~/types/menu'

const props = defineProps<{ menu: PublicMenu, preview?: boolean }>()

// Prices read "120 TL": Jost has no ₺ glyph, and a fallback-font ₺ looks pasted on in this face.

useHead({
  link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300..600;1,300..400&display=swap' }],
})

const categories = computed(() => props.menu.categories)
const { anchor, go } = useMenuNav(() => categories.value, { enabled: !props.preview })

const sheetId = `${useId()}-sheet`
const open = ref(false)
const pill = ref<HTMLButtonElement | null>(null)
const sheet = ref<HTMLElement | null>(null)

async function show() {
  open.value = true
  await nextTick()
  sheet.value?.querySelector<HTMLElement>('a')?.focus()
}

function close(returnFocus = true) {
  open.value = false
  if (returnFocus) nextTick(() => pill.value?.focus())
}

function pick(id: number) {
  close(false)
  nextTick(() => go(id))
}

/** Tab stays inside the open sheet. */
function trap(event: KeyboardEvent) {
  const focusable = sheet.value?.querySelectorAll<HTMLElement>('a, button')
  if (!focusable?.length) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <div class="aksam" :class="{ 'is-preview': preview }">
    <header class="head">
      <!-- With a logo the name still shows, quieter, under the plate. -->
      <h1 class="name" :class="{ 'has-logo': menu.logo_url }">
        <span v-if="menu.logo_url" class="plate plate-logo">
          <img :src="menu.logo_url" alt="">
        </span>
        {{ menu.name }}
      </h1>
    </header>

    <component :is="preview ? 'div' : 'main'" class="menu" :inert="open || undefined">
      <p v-if="!categories.length" class="empty">
        Menü hazırlanıyor.
      </p>
      <section v-for="c in categories" :key="c.id" class="cat" :aria-labelledby="anchor(c.id)">
        <h2 :id="anchor(c.id)" class="cat-name" tabindex="-1">
          {{ c.name }}
        </h2>
        <ul class="items">
          <li v-for="item in c.items" :key="item.id" class="item">
            <span v-if="item.image_url" class="plate">
              <img :src="item.image_url" alt="" loading="lazy">
            </span>
            <p class="item-name">
              {{ item.name }}
            </p>
            <p v-if="item.description" class="desc">
              {{ item.description }}
            </p>
            <p v-if="item.price !== null" class="price">
              {{ formatAmount(item.price) }}&nbsp;TL
            </p>
          </li>
        </ul>
      </section>
    </component>

    <template v-if="categories.length > 1">
      <button
        v-show="!open"
        ref="pill"
        type="button"
        class="pill"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-controls="sheetId"
        @click="show"
      >
        Kategoriler
      </button>

      <Transition name="fade">
        <nav
          v-if="open"
          :id="sheetId"
          ref="sheet"
          class="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Kategoriler"
          @keydown.esc="close()"
          @keydown.tab="trap"
        >
          <ul class="sheet-list">
            <li v-for="c in categories" :key="c.id">
              <a :href="`#${anchor(c.id)}`" class="sheet-link" @click.prevent="pick(c.id)">{{ c.name }}</a>
            </li>
          </ul>
          <button type="button" class="sheet-close" @click="close()">
            Kapat
          </button>
        </nav>
      </Transition>
    </template>
  </div>
</template>

<style scoped>
.aksam {
  --gece: #0F2B31;
  --derin: #163A41;
  --ay: #EEF2EC;
  --sis: #A7BFBA;
  --cizgi: #2C5058;

  position: relative;
  min-height: 100dvh;
  /* Room under the last item for the floating pill (20 + 48), breathing space, and the home bar. */
  padding-bottom: calc(132px + env(safe-area-inset-bottom));
  background: var(--gece);
  color: var(--ay);
  font-family: "Jost", "Futura", "Century Gothic", sans-serif;
  font-size: 1.0625rem;
  line-height: 1.5;
  text-align: center;
}

.aksam :focus-visible {
  outline: 2px solid var(--ay);
  outline-offset: 3px;
}

.head {
  padding: 56px 24px 8px;
}

.name {
  max-width: 30rem;
  margin: 0 auto;
  font-size: 2.125rem;
  line-height: 1.18;
  font-weight: 300;
  letter-spacing: 0.01em;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

/* Plates: a light rim around a round crop. Food from above, or the logo set on a plate. */
.plate {
  display: block;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  padding: 4px;
  border-radius: 50%;
  background: var(--ay);
}

.plate img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: var(--derin);
}

.name.has-logo {
  font-size: 1.5rem;
  line-height: 1.25;
  letter-spacing: 0.02em;
}

.plate-logo {
  width: 136px;
  height: 136px;
  margin-bottom: 18px;
  padding: 22px;
}

.plate-logo img {
  border-radius: 0;
  object-fit: contain;
  background: transparent;
}

.menu {
  display: block;
  max-width: 560px;
  margin: 0 auto;
  padding: 0 24px;
}

.empty {
  padding-top: 48px;
  color: var(--sis);
  font-style: italic;
}

.cat {
  padding-top: 56px;
}

.cat-name {
  scroll-margin-top: 24px;
  font-size: 1.5rem;
  line-height: 1.25;
  font-weight: 400;
  font-style: italic;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.cat-name::after {
  content: "";
  display: block;
  width: 32px;
  height: 1px;
  margin: 14px auto 0;
  background: var(--sis);
}

.cat-name:focus {
  outline: none;
}

.cat-name:focus-visible {
  outline: 2px solid var(--ay);
}

.items {
  list-style: none;
}

.item {
  padding-top: 32px;
}

.item-name {
  max-width: 26rem;
  margin: 0 auto;
  font-size: 1.125rem;
  line-height: 1.4;
  font-weight: 500;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.desc {
  max-width: 26rem;
  margin: 2px auto 0;
  color: var(--sis);
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 300;
  font-style: italic;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.price {
  margin-top: 4px;
  color: var(--sis);
  font-size: 1.0625rem;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

/* Thumb-reach pill, and the sheet it opens. */
.pill {
  position: fixed;
  bottom: calc(20px + env(safe-area-inset-bottom));
  left: 50%;
  z-index: 3;
  min-height: 48px;
  padding: 0 26px;
  border-radius: 999px;
  background: var(--ay);
  color: var(--gece);
  font-size: 1.0625rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  transform: translateX(-50%);
  box-shadow: 0 8px 24px -6px rgb(0 0 0 / 0.55);
  cursor: pointer;
}

.pill:focus-visible {
  outline-offset: 4px;
}

.sheet {
  position: fixed;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  padding: 48px 24px calc(32px + env(safe-area-inset-bottom));
  background: rgb(22 58 65 / 0.98);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sheet-list {
  list-style: none;
  margin: auto 0;
}

.sheet-link {
  display: block;
  padding: 10px 0;
  color: var(--ay);
  font-size: 1.625rem;
  line-height: 1.25;
  font-weight: 300;
  font-style: italic;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.sheet-close {
  align-self: center;
  min-height: 48px;
  margin-top: 24px;
  padding: 0 26px;
  border: 1px solid var(--sis);
  border-radius: 999px;
  color: var(--ay);
  font-size: 1.0625rem;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

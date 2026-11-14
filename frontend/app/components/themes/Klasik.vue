<!--
  Çini (key `klasik`). Glaze white, cobalt ink, a drawn İznik-style tile band top and bottom.
  A well-set list: dotted leaders join each name to its price. Sticky tile-chip strip for categories.
  See .claude/design/themes.md.
-->
<script setup lang="ts">
import type { PublicMenu } from '~/types/menu'

const props = defineProps<{ menu: PublicMenu, preview?: boolean }>()

useHead({
  link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..800;1,400&display=swap' }],
})

const categories = computed(() => props.menu.categories)
const { anchor, active, go } = useMenuNav(() => categories.value, { offset: 60, enabled: !props.preview })

// Keep the active chip in view inside the strip (horizontal only, never moves the page).
const strip = ref<HTMLElement | null>(null)
watch(active, (id) => {
  const chip = strip.value?.querySelector<HTMLElement>(`[data-cat="${id}"]`)
  if (!strip.value || !chip) return
  const left = chip.offsetLeft - (strip.value.clientWidth - chip.offsetWidth) / 2
  strip.value.scrollTo({ left, behavior: 'smooth' })
})
</script>

<template>
  <div class="cini" :class="{ 'is-preview': preview }">
    <div class="band" aria-hidden="true" />

    <header class="head">
      <!-- With a logo the name still shows, set smaller under it: a monogram alone doesn't say who you are. -->
      <h1 class="name" :class="{ 'has-logo': menu.logo_url }">
        <img v-if="menu.logo_url" :src="menu.logo_url" alt="" class="logo">
        {{ menu.name }}
      </h1>
    </header>

    <nav v-if="categories.length > 1" class="chips" aria-label="Kategoriler">
      <ul ref="strip" class="chips-strip">
        <li v-for="c in categories" :key="c.id">
          <a
            :href="`#${anchor(c.id)}`"
            class="chip"
            :data-cat="c.id"
            :aria-current="active === c.id ? 'true' : undefined"
            @click.prevent="go(c.id)"
          >{{ c.name }}</a>
        </li>
      </ul>
    </nav>

    <component :is="preview ? 'div' : 'main'" class="list">
      <p v-if="!categories.length" class="empty">
        Menü hazırlanıyor.
      </p>
      <section v-for="c in categories" :key="c.id" class="cat" :aria-labelledby="anchor(c.id)">
        <h2 :id="anchor(c.id)" class="cat-name" tabindex="-1">
          {{ c.name }}
        </h2>
        <ul class="items">
          <li v-for="item in c.items" :key="item.id" class="item" :class="{ 'has-photo': item.image_url }">
            <img v-if="item.image_url" :src="item.image_url" alt="" class="photo" loading="lazy">
            <div class="body">
              <p class="line">
                <span class="item-name">{{ item.name }}</span>
                <template v-if="item.price !== null">
                  <span class="dots" aria-hidden="true" />
                  <span class="price">{{ formatPrice(item.price) }}</span>
                </template>
              </p>
              <p v-if="item.description" class="desc">
                {{ item.description }}
              </p>
            </div>
          </li>
        </ul>
      </section>
    </component>

    <div class="band band-end" aria-hidden="true" />
  </div>
</template>

<style scoped>
.cini {
  --sir: #F8FAFD;
  --murekkep: #1A2A52;
  --kobalt: #2343A0;
  --kursun: #4A5878;
  --nokta: #8E9BBB;
  --chip-h: 60px;

  min-height: 100dvh;
  background: var(--sir);
  color: var(--murekkep);
  font-family: "Alegreya", Georgia, serif;
  font-size: 1.0625rem;
  line-height: 1.5;
  font-variant-numeric: lining-nums;
}

.cini :focus-visible {
  outline: 2px solid var(--kobalt);
  outline-offset: 3px;
}

/* The tile: cobalt ground, four glaze petals, turquoise heart, İznik-red corner dots that join across tiles. */
.band {
  height: 28px;
  background-color: var(--kobalt);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath fill='%23F8FAFD' d='M14 3.5c3.2 3 3.2 7.2 0 10.5-3.2-3.3-3.2-7.5 0-10.5zm0 21c3.2-3 3.2-7.2 0-10.5-3.2 3.3-3.2 7.5 0 10.5zM3.5 14c3-3.2 7.2-3.2 10.5 0-3.3 3.2-7.5 3.2-10.5 0zm21 0c-3-3.2-7.2-3.2-10.5 0 3.3 3.2 7.5 3.2 10.5 0z'/%3E%3Ccircle cx='14' cy='14' r='2.4' fill='%230F7C7C'/%3E%3Cg fill='%23B8322A'%3E%3Ccircle r='2.6'/%3E%3Ccircle cx='28' r='2.6'/%3E%3Ccircle cy='28' r='2.6'/%3E%3Ccircle cx='28' cy='28' r='2.6'/%3E%3C/g%3E%3C/svg%3E");
  background-position: center top;
  background-repeat: repeat-x;
}

.band-end {
  margin-top: 56px;
}

.head {
  padding: 40px 20px 32px;
  text-align: center;
}

.name {
  margin: 0 auto;
  max-width: 36rem;
  color: var(--kobalt);
  font-size: 2.125rem;
  line-height: 1.12;
  font-weight: 700;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.name.has-logo {
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 600;
}

.logo {
  display: block;
  margin: 0 auto 14px;
  max-width: min(240px, 70%);
  max-height: 104px;
  object-fit: contain;
}

/* Category strip: tile-shaped chips, sticky under the top edge. */
.chips {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--sir);
  border-block: 1px solid #D5DCEC;
}

.chips-strip {
  display: flex;
  gap: 8px;
  max-width: 640px;
  margin: 0 auto;
  padding: 8px 20px;
  overflow-x: auto;
  scrollbar-width: none;
  list-style: none;
}

.chips-strip::-webkit-scrollbar {
  display: none;
}

.chip {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 14px;
  border: 1.5px solid var(--kobalt);
  border-radius: 4px;
  color: var(--kobalt);
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
}

.chip[aria-current="true"] {
  background: var(--kobalt);
  color: var(--sir);
}

.list {
  display: block;
  max-width: 640px;
  margin: 0 auto;
  padding: 8px 20px 0;
}

.empty {
  padding: 32px 0;
  color: var(--kursun);
  font-style: italic;
  text-align: center;
}

.cat {
  padding-top: 36px;
}

.cat-name {
  scroll-margin-top: calc(var(--chip-h) + 12px);
  margin-bottom: 12px;
  color: var(--kobalt);
  font-size: 1.625rem;
  line-height: 1.15;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.cat-name:focus {
  outline: none;
}

.cat-name:focus-visible {
  outline: 2px solid var(--kobalt);
}

.items {
  list-style: none;
}

.item {
  padding: 10px 0;
}

.item.has-photo {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.photo {
  width: 68px;
  height: 68px;
  border-radius: 4px;
  object-fit: cover;
  background: #E3E8F3;
}

/* Name, leader, price. The leader and price sit on the name's last line. */
.line {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  font-size: 1.125rem;
  line-height: 1.35;
}

.item-name {
  flex: 0 1 auto;
  min-width: 0;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.dots {
  flex: 1 1 1.25rem;
  min-width: 1.25rem;
  height: 6px;
  margin-bottom: 0.4em;
  background: radial-gradient(circle, var(--nokta) 1.1px, transparent 1.6px) left center / 6px 6px repeat-x;
}

.price {
  flex: none;
  font-weight: 600;
  font-variant-numeric: lining-nums tabular-nums;
  white-space: nowrap;
}

.desc {
  margin-top: 2px;
  max-width: 34rem;
  color: var(--kursun);
  font-size: 1rem;
  line-height: 1.45;
  font-style: italic;
  overflow-wrap: anywhere;
}
</style>

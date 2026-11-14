<!--
  Pano (key `modern`). The price board above a counter: pistachio ground, condensed signage type.
  The menu opens with its contents in huge type; a sticky bar shows where you are and leads back.
  See .claude/design/themes.md.
-->
<script setup lang="ts">
import type { PublicMenu } from '~/types/menu'

const props = defineProps<{ menu: PublicMenu, preview?: boolean }>()

useHead({
  link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Big+Shoulders:opsz,wght@10..72,400..900&display=swap' }],
})

const categories = computed(() => props.menu.categories)
const many = computed(() => categories.value.length > 1)
const { anchor, active, go } = useMenuNav(() => categories.value, { offset: 52, enabled: !props.preview, untilPassed: true })

const tocId = `${useId()}-toc`
// Before the first category reaches the bar, the bar carries the restaurant name.
const current = computed(() => categories.value.find(c => c.id === active.value)?.name ?? props.menu.name)

function toContents() {
  const el = document.getElementById(tocId)
  if (!el) return
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  el.focus({ preventScroll: true })
}
</script>

<template>
  <div class="pano" :class="{ 'is-preview': preview }">
    <div class="wrap">
      <header class="head">
        <!-- With a logo the name still shows, one step smaller, under it on the board. -->
        <h1 class="name" :class="{ 'has-logo': menu.logo_url }">
          <img v-if="menu.logo_url" :src="menu.logo_url" alt="" class="logo">
          {{ menu.name }}
        </h1>
      </header>

      <nav v-if="many" :id="tocId" class="toc" aria-label="Kategoriler" tabindex="-1">
        <ul>
          <li v-for="c in categories" :key="c.id">
            <a :href="`#${anchor(c.id)}`" class="toc-link" @click.prevent="go(c.id)">
              <span class="toc-name">{{ c.name }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <div v-if="many" class="bar">
      <div class="bar-in">
        <p class="bar-current" aria-hidden="true">
          {{ current }}
        </p>
        <a :href="`#${tocId}`" class="bar-link" @click.prevent="toContents">Kategoriler</a>
      </div>
    </div>

    <component :is="preview ? 'div' : 'main'" class="menu">
      <p v-if="!categories.length" class="wrap empty">
        Menü hazırlanıyor.
      </p>
      <section v-for="c in categories" :key="c.id" class="cat" :aria-labelledby="anchor(c.id)">
        <h2 :id="anchor(c.id)" class="cat-name" tabindex="-1">
          <span class="wrap">{{ c.name }}</span>
        </h2>
        <ul class="wrap items">
          <li v-for="item in c.items" :key="item.id" class="item">
            <div class="line">
              <p class="item-name">
                {{ item.name }}
              </p>
              <p v-if="item.price !== null" class="price">
                {{ formatAmount(item.price) }}<span class="lira">₺</span>
              </p>
            </div>
            <p v-if="item.description" class="desc">
              {{ item.description }}
            </p>
            <img v-if="item.image_url" :src="item.image_url" alt="" class="photo" loading="lazy">
          </li>
        </ul>
      </section>
    </component>
  </div>
</template>

<style scoped>
.pano {
  --fistik: #CFE6A1;
  --yaprak: #13311C;
  --kabuk: #3E5C35;
  --bar-h: 52px;

  container: pano / inline-size;

  min-height: 100dvh;
  padding-bottom: 64px;
  background: var(--fistik);
  color: var(--yaprak);
  font-family: "Big Shoulders", "Arial Narrow", sans-serif;
  font-optical-sizing: auto;
  font-size: 1.0625rem;
  line-height: 1.35;
}

.pano :focus-visible {
  outline: 3px solid var(--yaprak);
  outline-offset: 2px;
}

.wrap {
  display: block;
  max-width: 720px;
  margin: 0 auto;
  padding-inline: 20px;
}

.head {
  padding: 36px 0 28px;
}

.name {
  font-size: 3.75rem;
  line-height: 0.9;
  font-weight: 900;
  letter-spacing: -0.005em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.name.has-logo {
  font-size: 2.75rem;
  line-height: 0.95;
}

.logo {
  display: block;
  margin-bottom: 16px;
  max-width: min(260px, 75%);
  max-height: 120px;
  object-fit: contain;
}

/* The board: contents in huge type. Each line is a jump. */
.toc {
  padding-bottom: 28px;
}

.toc:focus {
  outline: none;
}

.toc ul {
  list-style: none;
  border-top: 3px solid var(--yaprak);
}

.toc-link {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0 4px;
  border-bottom: 3px solid var(--yaprak);
  color: inherit;
  text-decoration: none;
}

.toc-name {
  min-width: 0;
  font-size: 2.5rem;
  line-height: 1.05;
  font-weight: 800;
  overflow-wrap: anywhere;
}


@container pano (min-width: 900px) {
  .toc ul {
    columns: 2;
    column-gap: 40px;
  }
  .toc li {
    break-inside: avoid;
  }
}

/* Where you are, and the way back to the board. */
.bar {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--yaprak);
  color: var(--fistik);
}

.bar-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 720px;
  height: var(--bar-h);
  margin: 0 auto;
  padding-inline: 20px;
}

.bar-current {
  min-width: 0;
  overflow: hidden;
  font-size: 1.5rem;
  font-weight: 800;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.bar-link {
  display: flex;
  flex: none;
  align-items: center;
  min-height: 44px;
  color: var(--fistik);
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.18em;
  text-decoration-thickness: 2px;
}

.bar-link:focus-visible {
  outline-color: var(--fistik);
}

.menu {
  display: block;
}

.empty {
  padding-top: 32px;
  font-size: 1.5rem;
  font-weight: 700;
}

.cat {
  padding-top: 40px;
}

.cat:first-child {
  padding-top: 0;
}

.cat-name {
  scroll-margin-top: var(--bar-h);
  padding: 12px 0 8px;
  background: var(--yaprak);
  color: var(--fistik);
  font-size: 2.75rem;
  line-height: 1;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.cat-name:focus {
  outline: none;
}

.cat-name:focus-visible {
  outline: 3px solid var(--fistik);
  outline-offset: -6px;
}

.items {
  list-style: none;
}

.item {
  padding: 16px 0 14px;
}

.item + .item {
  border-top: 1.5px solid rgb(19 49 28 / 0.28);
}

.line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.item-name {
  min-width: 0;
  font-size: 1.4375rem;
  line-height: 1.12;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.price {
  flex: none;
  font-size: 1.625rem;
  line-height: 1;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.lira {
  margin-left: 0.12em;
  font-size: 0.7em;
  font-weight: 700;
}

.desc {
  margin-top: 4px;
  max-width: 34rem;
  color: var(--kabuk);
  font-size: 1.0625rem;
  line-height: 1.35;
  font-weight: 450;
  overflow-wrap: anywhere;
}

.photo {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  margin-top: 12px;
  border-radius: 4px;
  object-fit: cover;
  background: #B9D58A;
}

@container pano (min-width: 640px) {
  .photo {
    max-width: 420px;
  }
}

</style>

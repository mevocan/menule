<!--
  The landing page: what Menüle does and how, shown with real screenshots of the app
  (frontend/public/screenshots, same files the README uses).
-->
<script setup lang="ts">
const siteOrigin = useSiteOrigin()

useHead({ title: 'Menüle · Kâğıt menünüzden QR menü' })
useSeoMeta({
  description: 'Kâğıt menünüzün fotoğrafını çekin; ürünler ve fiyatlar okunur, siz kontrol edip yayınlarsınız. Müşterileriniz QR kodu okutunca menünüz telefonlarında açılır.',
  ogTitle: 'Menüle · Kâğıt menünüzden QR menü',
  ogDescription: 'Fotoğraf çekin, kontrol edin, tema seçin, QR kodu basın.',
  ogType: 'website',
  ogImage: `${siteOrigin}/screenshots/02-menu-duzenleme.png`,
})

const steps = [
  {
    title: 'Menünüzün fotoğrafını çekin',
    text: 'Telefonla çekin ya da galeriden seçin, tek seferde en fazla 5 fotoğraf. Fotoğrafınız yoksa menüyü kategorilerle elle de yazabilirsiniz.',
    img: '/screenshots/01-bos-panel.png',
    alt: 'Boş menü ekranı: solda “Fotoğraftan oku”, sağda “Elle ekle” seçenekleri.',
    w: 2560,
    h: 1640,
  },
  {
    title: 'Sarı işaretlileri kontrol edin',
    text: 'Ürünler ve fiyatlar kategorileriyle düzenleme ekranına yazılır. Okunamayan fiyatlar ve emin olunamayan ürünler fosforlu kalemle işaretlenir; düzeltip onaylarsınız.',
    img: '/screenshots/02-menu-duzenleme.png',
    alt: 'Düzenleme ekranı: Çorbalar kategorisi, “İşkembe Çorbası” sarıyla işaretli ve fiyatı yok.',
    w: 2560,
    h: 1640,
  },
  {
    title: 'Temanızı seçin',
    text: 'Menünüz üç temada yan yana önizlenir: Çini, Pano ve Akşam. Seçtiğiniz tema hemen kaydedilir.',
    img: '/screenshots/03-temalar.png',
    alt: 'Aynı menünün Çini, Pano ve Akşam temalarında telefon önizlemeleri.',
    w: 1792,
    h: 1444,
  },
  {
    title: 'QR kodu basın',
    text: 'Dört stil arasından seçin, ortaya logonuzu koyun. PNG veya SVG olarak indirip masalara, menüye ya da vitrine basın.',
    img: '/screenshots/04-qr.png',
    alt: 'QR kodu bölümü: dört stil seçeneği, PNG ve SVG indirme düğmeleri.',
    w: 1440,
    h: 886,
  },
]

const themes = [
  { name: 'Çini', text: 'Beyaz zemin, kobalt mavisi, çini deseni.', img: '/screenshots/menu-cini.png' },
  { name: 'Pano', text: 'Fıstık yeşili zemin, iri ve dar harfler.', img: '/screenshots/menu-pano.png' },
  { name: 'Akşam', text: 'Koyu zemin, ortalanmış sakin yazı.', img: '/screenshots/menu-aksam.png' },
]

const features = [
  { title: 'Fotoğraftan okuma', text: 'Ürün adı, açıklama, fiyat ve kategori. Porsiyon farkları ayrı satır olarak yazılır. Adres, telefon gibi menü dışı yazılar atlanır.' },
  { title: 'Uydurma yok', text: 'Okunamayan fiyat boş bırakılır, emin olunamayan ürün işaretlenir. Hiçbir şey kendiliğinden yayına çıkmaz.' },
  { title: 'Elle menü', text: 'Fotoğraf şart değil. Kategori ve ürünleri kendiniz yazın; okunan ürünlerle aynı ekranda durur.' },
  { title: 'Düzenleme', text: 'Ürünleri yukarı aşağı taşıyın, başka kategoriye aktarın, fiyatları güncelleyin, ürün fotoğrafı ekleyin.' },
  { title: 'Logo', text: 'Logonuz menünün başında ve isterseniz QR kodun ortasında görünür.' },
  { title: 'Hemen yayında', text: 'Menüde yaptığınız her değişiklik müşterinin telefonuna anında yansır.' },
  { title: 'Adres değişmez', text: 'Yayınladıktan sonra menü adresiniz sabit kalır. Fiyat değişse de QR kodu yeniden bastırmanız gerekmez.' },
  { title: 'Uygulama gerekmez', text: 'Müşteriniz telefon kamerasıyla okutur, menü tarayıcıda açılır. İndirme, üyelik yok.' },
]

const faqs = [
  {
    q: 'Ücretli mi?',
    a: 'Hayır. Menü oluşturmak, yayınlamak ve QR kodu indirmek ücretsiz. Fotoğraftan okuma ayda 10 fotoğrafla sınırlı; elle düzenlemenin sınırı yok.',
  },
  {
    q: 'Okuma her zaman doğru mu?',
    a: 'Her zaman değil. Bulanık ya da el yazısı menülerde hata olabilir. Bu yüzden emin olunamayan ürünler sarıyla işaretlenir ve yayınlamadan önce menünün tamamını görürsünüz.',
  },
  {
    q: 'Fotoğraf okutunca mevcut menüm silinir mi?',
    a: 'Hayır. Okunan ürünler menünüzün sonuna eklenir. Menünüzün ikinci sayfasını ayrıca okutabilirsiniz.',
  },
  {
    q: 'Fiyatlar değişince ne yapacağım?',
    a: 'Panelden fiyatı değiştirin. Müşteriler aynı QR kodu okuttuğunda yeni fiyatı görür.',
  },
  {
    q: 'Sipariş veya ödeme alabilir miyim?',
    a: 'Hayır. Menüle yalnızca menünüzü gösterir; sipariş, sepet ve ödeme yoktur.',
  },
]
</script>

<template>
  <div>
    <header class="border-b border-rule">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
        <NuxtLink to="/" class="font-condensed text-wordmark">
          Menüle
        </NuxtLink>
        <nav aria-label="Sayfa" class="ml-6 hidden gap-6 md:flex">
          <a href="#nasil" class="font-semibold text-graphite-2 hover:text-graphite">Nasıl çalışır</a>
          <a href="#temalar" class="font-semibold text-graphite-2 hover:text-graphite">Temalar</a>
          <a href="#sss" class="font-semibold text-graphite-2 hover:text-graphite">Sorular</a>
        </nav>
        <NuxtLink to="/giris" class="btn-text ml-auto">
          Giriş yap
        </NuxtLink>
        <NuxtLink to="/kayit" class="btn-primary hidden h-10 sm:inline-flex">
          Ücretsiz başla
        </NuxtLink>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="mx-auto max-w-6xl px-4 pt-12 pb-16 md:px-8 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12 lg:pt-20 lg:pb-24">
        <div>
          <h1 class="font-condensed text-h1 md:text-display">
            Kâğıt menünüzün fotoğrafını çekin. <span class="marker">QR menünüz</span> hazır.
          </h1>
          <p class="measure mt-5 text-graphite-2 md:text-[1.0625rem] md:leading-7">
            Menüle fotoğraftaki ürünleri ve fiyatları okur, emin olamadıklarını sarıyla işaretler.
            Siz kontrol edip yayınlarsınız; müşterileriniz QR kodu okutunca menünüz telefonlarında açılır.
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <NuxtLink to="/kayit" class="btn-primary">
              Ücretsiz başla
            </NuxtLink>
            <a href="#nasil" class="btn-secondary">Nasıl çalışır?</a>
          </div>
          <p class="mt-4 text-small text-graphite-2">
            Kredi kartı istemez. Müşterileriniz uygulama indirmez.
          </p>
        </div>
        <div class="mt-12 lg:mt-0">
          <div class="relative">
            <img
              src="/screenshots/02-menu-duzenleme.png"
              width="2560"
              height="1640"
              alt="Menüle düzenleme ekranı: kategoriler, fiyatlar ve sarıyla işaretlenmiş kontrol edilecek ürün."
              class="w-full rounded-sheet border border-rule shadow-pop"
              fetchpriority="high"
            >
            <img
              src="/screenshots/menu-cini.png"
              width="780"
              height="1688"
              alt="Aynı menü müşterinin telefonunda, Çini temasıyla."
              class="absolute -bottom-8 -left-4 hidden w-[28%] rounded-[14px] border-4 border-graphite shadow-pop sm:block lg:-left-10"
            >
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section id="nasil" aria-labelledby="nasil-title" class="scroll-mt-4 bg-carbon py-16 lg:py-24">
        <div class="mx-auto max-w-6xl px-4 md:px-8">
          <h2 id="nasil-title" class="font-condensed text-h1">
            Nasıl çalışır?
          </h2>
          <p class="measure mt-2 text-graphite-2">
            Dört adım. Okumayı Menüle yapar; size kontrol etmek kalır.
          </p>

          <ol class="mt-12 space-y-16 lg:space-y-24">
            <li
              v-for="(step, i) in steps"
              :key="step.title"
              class="lg:grid lg:items-center lg:gap-12"
              :class="i % 2 === 1 ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]' : 'lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]'"
            >
              <div :class="i % 2 === 1 && 'lg:order-2'">
                <span class="font-condensed text-h1 text-ink tabular-nums">{{ i + 1 }}</span>
                <h3 class="mt-1 font-condensed text-h2">
                  {{ step.title }}
                </h3>
                <p class="measure mt-2 text-graphite-2">
                  {{ step.text }}
                </p>
              </div>
              <img
                :src="step.img"
                :width="step.w"
                :height="step.h"
                :alt="step.alt"
                loading="lazy"
                class="mt-6 w-full rounded-sheet border border-rule bg-paper lg:mt-0"
                :class="i % 2 === 1 && 'lg:order-1'"
              >
            </li>
          </ol>
        </div>
      </section>

      <!-- What diners see -->
      <section id="temalar" aria-labelledby="temalar-title" class="scroll-mt-4 py-16 lg:py-24">
        <div class="mx-auto max-w-6xl px-4 md:px-8">
          <h2 id="temalar-title" class="font-condensed text-h1">
            Müşterileriniz böyle görür
          </h2>
          <p class="measure mt-2 text-graphite-2">
            Aynı menü, üç tema. Telefonda hızlı açılır, kategoriler arasında kolayca gezilir.
          </p>
          <ul class="-mx-4 mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            <li v-for="theme in themes" :key="theme.name" class="w-[68%] shrink-0 snap-start md:w-auto">
              <img
                :src="theme.img"
                width="780"
                height="1688"
                :alt="`Örnek menü, ${theme.name} temasıyla telefonda.`"
                loading="lazy"
                class="w-full rounded-[18px] border-[5px] border-graphite"
              >
              <p class="mt-4 text-item font-semibold">
                {{ theme.name }}
              </p>
              <p class="text-small text-graphite-2">
                {{ theme.text }}
              </p>
            </li>
          </ul>
        </div>
      </section>

      <!-- Features -->
      <section aria-labelledby="ozellik-title" class="border-t border-rule py-16 lg:py-24">
        <div class="mx-auto max-w-6xl px-4 md:px-8">
          <h2 id="ozellik-title" class="font-condensed text-h1">
            Neler yapabilirsiniz?
          </h2>
          <dl class="mt-10 grid gap-x-12 md:grid-cols-2">
            <div v-for="f in features" :key="f.title" class="border-t border-rule py-5">
              <dt class="text-item font-semibold">
                {{ f.title }}
              </dt>
              <dd class="measure mt-1 text-graphite-2">
                {{ f.text }}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Phone -->
      <section aria-labelledby="telefon-title" class="bg-carbon py-16 lg:py-24">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] md:px-8">
          <div>
            <h2 id="telefon-title" class="font-condensed text-h1">
              Tezgâhın başından yönetin
            </h2>
            <p class="measure mt-3 text-graphite-2">
              Panel telefonda da tam çalışır. Fotoğrafı telefonun kamerasıyla çekin, fiyatı müşteri beklerken değiştirin.
              Bilgisayara ihtiyacınız yok.
            </p>
          </div>
          <img
            src="/screenshots/05-panel-telefon.png"
            width="780"
            height="1688"
            alt="Menüle paneli telefonda: menü adresi, fotoğraf yükleme ve kontrol edilecek ürünler."
            loading="lazy"
            class="mx-auto w-[64%] max-w-[300px] rounded-[18px] border-[5px] border-graphite md:w-full"
          >
        </div>
      </section>

      <!-- FAQ -->
      <section id="sss" aria-labelledby="sss-title" class="scroll-mt-4 py-16 lg:py-24">
        <div class="mx-auto max-w-3xl px-4 md:px-8">
          <h2 id="sss-title" class="font-condensed text-h1">
            Sık sorulanlar
          </h2>
          <div class="mt-8 border-b border-rule">
            <details v-for="f in faqs" :key="f.q" class="group border-t border-rule">
              <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-item font-semibold [&::-webkit-details-marker]:hidden">
                {{ f.q }}
                <span aria-hidden="true" class="text-h2 font-normal text-ink transition-transform group-open:rotate-45">+</span>
              </summary>
              <p class="measure pb-5 text-graphite-2">
                {{ f.a }}
              </p>
            </details>
          </div>
        </div>
      </section>

      <!-- Closing call -->
      <section class="bg-ink py-16 text-paper lg:py-20">
        <div class="mx-auto max-w-6xl px-4 md:px-8">
          <h2 class="font-condensed text-h1 md:text-display">
            Kâğıt menünüz yeter.
          </h2>
          <p class="measure mt-3 text-ink-wash">
            Hesabınızı açın, menünüzün fotoğrafını yükleyin, bugün masalara QR kodu koyun.
          </p>
          <NuxtLink
            to="/kayit"
            class="mt-8 inline-flex h-12 items-center rounded-control bg-paper px-5 text-button text-ink hover:bg-ink-wash"
          >
            Ücretsiz başla
          </NuxtLink>
        </div>
      </section>
    </main>

    <footer class="border-t border-rule">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-small text-graphite-2 md:px-8">
        <span class="font-condensed text-wordmark text-graphite">Menüle</span>
        <span>Restoranlar için QR menü</span>
        <span class="md:ml-auto">© 2026 Menüle</span>
      </div>
    </footer>
  </div>
</template>

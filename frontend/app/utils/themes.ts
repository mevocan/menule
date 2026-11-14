import type { PublicCategory, PublicMenu, ThemeKey } from '~/types/menu'

export interface ThemeInfo {
  key: ThemeKey
  /** Display name shown to the owner. The key is only a storage value. */
  name: string
  description: string
  /** Page ground: the `html` background on /qr so overscroll matches, and the browser's theme colour. */
  ground: string
}

export const THEMES: ThemeInfo[] = [
  {
    key: 'klasik',
    name: 'Çini',
    description: 'Beyaz zemin, kobalt mavisi yazı ve çini deseni. Fiyatlar noktalı çizgiyle ürüne bağlanır.',
    ground: '#F8FAFD',
  },
  {
    key: 'modern',
    name: 'Pano',
    description: 'Fıstık yeşili zemin, iri ve dar harfler. Menü, kategorilerin büyük bir listesiyle açılır.',
    ground: '#CFE6A1',
  },
  {
    key: 'sade',
    name: 'Akşam',
    description: 'Koyu zemin, ortalanmış sakin yazı. Ürün fotoğrafları tabak gibi yuvarlak görünür.',
    ground: '#0F2B31',
  },
]

export const DEFAULT_THEME: ThemeKey = 'klasik'

export function themeInfo(key: string | null | undefined): ThemeInfo {
  return THEMES.find(t => t.key === key) ?? THEMES[0]!
}

/** A short, realistic menu for previews while the owner's own menu is still empty. */
export function sampleMenu(name: string, logoUrl: string | null): PublicMenu {
  let id = 0
  const item = (n: string, price: number | null, description: string | null = null) =>
    ({ id: ++id, name: n, description, price, image_url: null })
  const categories: PublicCategory[] = [
    {
      id: 1,
      name: 'Çorbalar',
      items: [
        item('Mercimek Çorbası', 120, 'Limon ve kıtır ekmekle'),
        item('Ezogelin Çorbası', 120),
        item('Günün Çorbası', null, 'Garsonunuza sorun'),
      ],
    },
    {
      id: 2,
      name: 'Izgaralar',
      items: [
        item('Adana Kebap', 340, 'Közlenmiş domates ve biber, lavaş'),
        item('Adana Kebap 1.5 Porsiyon', 480),
        item('Tavuk Şiş', 290, 'Bulgur pilavı ve yeşillik'),
      ],
    },
    {
      id: 3,
      name: 'Tatlılar',
      items: [
        item('Fıstıklı Künefe', 210),
        item('Sütlaç', 110, 'Fırında'),
      ],
    },
  ]
  return { name, slug: '', theme: null, logo_url: logoUrl, categories }
}

/** What a diner sees: `GET /api/public/restaurants/{slug}`. Empty categories are already left out. */
export interface PublicItem {
  id: number
  name: string
  description: string | null
  price: number | null
  image_url: string | null
}

export interface PublicCategory {
  id: number
  name: string
  items: PublicItem[]
}

export interface PublicMenu {
  name: string
  slug: string
  theme: string | null
  logo_url: string | null
  categories: PublicCategory[]
}

export type ThemeKey = 'klasik' | 'modern' | 'sade'

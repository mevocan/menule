import { defineStore } from 'pinia'
import { useRepo } from 'pinia-orm'
import Restaurant from '~/models/Restaurant'
import type { UserPayload } from '~/stores/auth'
import type { ThemeKey } from '~/types/menu'

type RestaurantPayload = NonNullable<UserPayload['restaurant']>

/** The owner's restaurant: name, logo, theme and publishing. Every change saves the server's answer. */
export const useRestaurantStore = defineStore('restaurant', () => {
  const api = useApi()
  const auth = useAuthStore()
  const router = useRouter()

  const restaurant = computed(() => auth.user?.restaurant ?? null)

  function save(payload: RestaurantPayload) {
    useRepo(Restaurant).save({ ...payload, user_id: auth.userId })
    return payload
  }

  async function guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run()
    }
    catch (error) {
      if ((error as { statusCode?: number })?.statusCode === 401) {
        auth.setUser(null)
        await router.push('/giris')
      }
      throw error
    }
  }

  function update(input: { name?: string, theme?: ThemeKey }) {
    return guard(async () => save(await api<RestaurantPayload>('/api/restaurant', { method: 'PUT', body: { ...input } })))
  }

  function uploadLogo(logo: Blob, filename: string) {
    const body = new FormData()
    body.append('logo', logo, filename)
    return guard(async () => save(await api<RestaurantPayload>('/api/restaurant/logo', { method: 'POST', body })))
  }

  function removeLogo() {
    return guard(async () => save(await api<RestaurantPayload>('/api/restaurant/logo', { method: 'DELETE' })))
  }

  function publish() {
    return guard(async () => save(await api<RestaurantPayload>('/api/restaurant/publish', { method: 'POST' })))
  }

  return { restaurant, update, uploadLogo, removeLogo, publish }
})

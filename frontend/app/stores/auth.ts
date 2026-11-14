import { defineStore } from 'pinia'
import { useRepo } from 'pinia-orm'
import User from '~/models/User'

export interface UserPayload {
  id: number
  name: string
  email: string
  restaurant: {
    id: number
    name: string
    slug: string
    theme: string | null
    logo_url: string | null
    published_at: string | null
  } | null
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  restaurant_name: string
}

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<number | null>(null)
  /** True once we have asked the backend who the current user is. */
  const checked = ref(false)

  const user = computed(() =>
    userId.value === null ? null : useRepo(User).with('restaurant').find(userId.value),
  )
  const loggedIn = computed(() => userId.value !== null)

  function setUser(payload: UserPayload | null) {
    const repo = useRepo(User)
    repo.flush()
    if (payload) {
      repo.save({ ...payload, restaurant: payload.restaurant ? { ...payload.restaurant, user_id: payload.id } : null })
    }
    userId.value = payload?.id ?? null
    checked.value = true
  }

  async function fetchUser() {
    const api = useApi()
    try {
      setUser(await api<UserPayload>('/api/user'))
    }
    catch {
      setUser(null)
    }
  }

  async function login(email: string, password: string) {
    const api = useApi()
    setUser(await api<UserPayload>('/api/login', { method: 'POST', body: { email, password } }))
  }

  async function register(payload: RegisterPayload) {
    const api = useApi()
    setUser(await api<UserPayload>('/api/register', { method: 'POST', body: { ...payload } }))
  }

  async function logout() {
    const api = useApi()
    await api('/api/logout', { method: 'POST' })
    setUser(null)
  }

  return { userId, checked, user, loggedIn, setUser, fetchUser, login, register, logout }
})

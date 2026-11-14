export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()
  if (!auth.checked) await auth.fetchUser()
  if (!auth.loggedIn) return navigateTo('/giris')
})

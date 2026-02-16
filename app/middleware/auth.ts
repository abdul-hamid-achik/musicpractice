export default defineNuxtRouteMiddleware((_to) => {
  const token = useCookie('auth_token')

  if (!token.value) {
    return navigateTo('/auth/login', { replace: true })
  }
})

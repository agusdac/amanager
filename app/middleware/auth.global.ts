export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = new Set([
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ])
  if (publicPaths.has(to.path)) return

  const session = await $fetch<{ user: { id: string } | null }>('/api/auth/session')
  if (!session.user) {
    return navigateTo('/login')
  }
})
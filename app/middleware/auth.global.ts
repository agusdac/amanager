export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = new Set([
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ])
  if (publicPaths.has(to.path)) return

  const api = import.meta.server ? useRequestFetch() : $fetch
  const session = await api<{ user: { id: string } | null }>('/api/auth/session')
  if (!session.user) {
    return navigateTo('/login')
  }
})
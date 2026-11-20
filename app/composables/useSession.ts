/** Session fetch that forwards cookies on SSR (full page reload). */
export function useSessionFetch() {
  const requestFetch = useRequestFetch()
  return useFetch<{
    user: { id: string; email: string; name: string; locale: string; workspaceId: string; workspaceRole: string } | null
  }>('/api/auth/session', {
    key: 'session',
    $fetch: requestFetch,
  })
}
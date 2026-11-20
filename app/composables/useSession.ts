/** Session fetch that forwards cookies on SSR (full page reload). */
export function useSessionFetch() {
  const requestFetch = useRequestFetch()
  return useFetch<{
    user: {
      id: string
      email: string
      name: string
      locale: string
      theme: string
      workspaceId: string
      workspaceRole: string
      workspaceType: string
      workspaceName: string
    } | null
  }>('/api/auth/session', {
    key: 'session',
    $fetch: requestFetch,
  })
}
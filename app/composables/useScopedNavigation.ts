/** Append workspace project/environment scope to route paths and fetch queries. */
export function useScopedNavigation() {
  const { projectId, environmentId } = useWorkspaceScope()

  function pathWithScope(path: string): string {
    if (!projectId.value) return path
    const params = new URLSearchParams()
    params.set('projectId', projectId.value)
    if (environmentId.value) params.set('environmentId', environmentId.value)
    const [base, hash = ''] = path.split('#')
    const joiner = base.includes('?') ? '&' : '?'
    return `${base}${joiner}${params.toString()}${hash ? `#${hash}` : ''}`
  }

  const scopeQuery = computed(() => {
    const q: Record<string, string> = {}
    if (projectId.value) q.projectId = projectId.value
    if (projectId.value && environmentId.value) q.environmentId = environmentId.value
    return q
  })

  return { pathWithScope, scopeQuery, projectId, environmentId }
}
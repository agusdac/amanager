export function useWorkspaceSwitch() {
  const { data: session, refresh: refreshSession } = useSessionFetch()
  const switching = useState('workspace-switching', () => false)
  const { persistScopeForWorkspace, hydrateScopeForWorkspace } = useWorkspaceScope()

  async function switchWorkspace(workspaceId: string) {
    const currentId = session.value?.user?.workspaceId
    if (!currentId || switching.value || workspaceId === currentId) return

    switching.value = true
    try {
      persistScopeForWorkspace(currentId)

      await $fetch(`/api/workspaces/${workspaceId}/switch`, {
        method: 'POST',
        body: { workspaceId },
      })

      await refreshSession()
      hydrateScopeForWorkspace(workspaceId)

      await refreshNuxtData()
      await navigateTo('/home')
    } finally {
      switching.value = false
    }
  }

  return { switching, switchWorkspace }
}
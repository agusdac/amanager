export type WorkspaceMemberOption = {
  userId: string
  name: string
  email: string
  role: string
}

export function useWorkspaceMembers() {
  const { data: session } = useSessionFetch()
  const workspaceId = computed(() => session.value?.user?.workspaceId)

  return useFetch<{ members: WorkspaceMemberOption[] }>(
    () => (workspaceId.value ? `/api/workspaces/${workspaceId.value}/members` : null),
    { watch: [workspaceId], key: 'workspace-members' },
  )
}
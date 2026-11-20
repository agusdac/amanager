const LEGACY_PROJECT = 'hilko-scope-project'
const LEGACY_ENV = 'hilko-scope-environment'

function projectStorageKey(workspaceId: string) {
  return `hilko-scope-project:${workspaceId}`
}

function envStorageKey(workspaceId: string) {
  return `hilko-scope-environment:${workspaceId}`
}

export function useWorkspaceScope() {
  const route = useRoute()
  const router = useRouter()
  const { data: session } = useSessionFetch()

  const projectId = useState<string>('workspace-scope-project', () => '')
  const environmentId = useState<string>('workspace-scope-environment', () => '')
  const hydrated = useState('workspace-scope-hydrated', () => false)
  const activeWorkspaceId = useState<string>('workspace-scope-workspace-id', () => '')

  function persistScopeForWorkspace(workspaceId: string) {
    if (!import.meta.client || !workspaceId) return
    localStorage.setItem(projectStorageKey(workspaceId), projectId.value)
    localStorage.setItem(envStorageKey(workspaceId), environmentId.value)
  }

  function hydrateScopeForWorkspace(workspaceId: string) {
    if (!import.meta.client || !workspaceId) return
    activeWorkspaceId.value = workspaceId
    let storedProject = localStorage.getItem(projectStorageKey(workspaceId)) ?? ''
    let storedEnv = localStorage.getItem(envStorageKey(workspaceId)) ?? ''

    if (!storedProject && !localStorage.getItem(projectStorageKey(workspaceId))) {
      const legacy = localStorage.getItem(LEGACY_PROJECT) ?? ''
      if (legacy) {
        storedProject = legacy
        storedEnv = localStorage.getItem(LEGACY_ENV) ?? ''
        localStorage.setItem(projectStorageKey(workspaceId), storedProject)
        if (storedEnv) localStorage.setItem(envStorageKey(workspaceId), storedEnv)
        localStorage.removeItem(LEGACY_PROJECT)
        localStorage.removeItem(LEGACY_ENV)
      }
    }

    projectId.value = storedProject
    environmentId.value = storedProject ? storedEnv : ''
    hydrated.value = true
    syncRouteQuery()
  }

  function persist() {
    if (!import.meta.client || !activeWorkspaceId.value) return
    persistScopeForWorkspace(activeWorkspaceId.value)
  }

  function syncRouteQuery() {
    if (!import.meta.client || !hydrated.value) return
    const next: Record<string, string | string[]> = { ...route.query }
    if (projectId.value) next.projectId = projectId.value
    else delete next.projectId
    if (projectId.value && environmentId.value) next.environmentId = environmentId.value
    else delete next.environmentId

    const same =
      (route.query.projectId ?? '') === (next.projectId ?? '') &&
      (route.query.environmentId ?? '') === (next.environmentId ?? '')
    if (!same) router.replace({ query: next })
  }

  function applyRouteScopeOverride() {
    const fromRouteProject = typeof route.query.projectId === 'string' ? route.query.projectId : ''
    const fromRouteEnv = typeof route.query.environmentId === 'string' ? route.query.environmentId : ''
    if (fromRouteProject) projectId.value = fromRouteProject
    if (fromRouteEnv && fromRouteProject) environmentId.value = fromRouteEnv
    if (fromRouteProject || fromRouteEnv) persist()
  }

  onMounted(() => {
    const wsId = session.value?.user?.workspaceId
    if (wsId) {
      hydrateScopeForWorkspace(wsId)
      applyRouteScopeOverride()
    } else if (!hydrated.value) {
      const legacyProject = localStorage.getItem(LEGACY_PROJECT) ?? ''
      const fromRouteProject = typeof route.query.projectId === 'string' ? route.query.projectId : ''
      projectId.value = fromRouteProject || legacyProject
      const fromRouteEnv = typeof route.query.environmentId === 'string' ? route.query.environmentId : ''
      environmentId.value =
        fromRouteEnv || (projectId.value ? (localStorage.getItem(LEGACY_ENV) ?? '') : '')
      hydrated.value = true
    }
    syncRouteQuery()
  })

  watch(
    () => [route.query.projectId, route.query.environmentId],
    () => {
      if (!hydrated.value) return
      const qProject = typeof route.query.projectId === 'string' ? route.query.projectId : ''
      const qEnv = typeof route.query.environmentId === 'string' ? route.query.environmentId : ''
      if (qProject !== projectId.value) projectId.value = qProject
      if (qEnv !== environmentId.value) environmentId.value = qProject ? qEnv : ''
      persist()
    },
  )

  function setProject(id: string) {
    projectId.value = id
    if (!id) environmentId.value = ''
    persist()
    syncRouteQuery()
  }

  function setEnvironment(id: string) {
    environmentId.value = id
    persist()
    syncRouteQuery()
  }

  /** Drop project filter when it does not exist in the active workspace. */
  function validateProjectInList(validIds: Set<string>) {
    if (projectId.value && !validIds.has(projectId.value)) {
      setProject('')
    }
  }

  const scopedProjectId = computed(() => projectId.value)
  const scopedEnvironmentId = computed(() => (projectId.value ? environmentId.value : ''))

  return {
    projectId: scopedProjectId,
    environmentId: scopedEnvironmentId,
    setProject,
    setEnvironment,
    hydrated,
    persistScopeForWorkspace,
    hydrateScopeForWorkspace,
    validateProjectInList,
  }
}
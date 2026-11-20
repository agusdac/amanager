const STORAGE_PROJECT = 'hilko-scope-project'
const STORAGE_ENV = 'hilko-scope-environment'

export function useWorkspaceScope() {
  const route = useRoute()
  const router = useRouter()

  const projectId = useState<string>('workspace-scope-project', () => '')
  const environmentId = useState<string>('workspace-scope-environment', () => '')
  const hydrated = useState('workspace-scope-hydrated', () => false)

  function persist() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_PROJECT, projectId.value)
    localStorage.setItem(STORAGE_ENV, environmentId.value)
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

  function hydrate() {
    if (!import.meta.client || hydrated.value) return
    const fromRouteProject = typeof route.query.projectId === 'string' ? route.query.projectId : ''
    const fromRouteEnv = typeof route.query.environmentId === 'string' ? route.query.environmentId : ''
    const fromStorageProject = localStorage.getItem(STORAGE_PROJECT) ?? ''
    const fromStorageEnv = localStorage.getItem(STORAGE_ENV) ?? ''

    projectId.value = fromRouteProject || fromStorageProject
    environmentId.value = fromRouteEnv || (projectId.value ? fromStorageEnv : '')
    hydrated.value = true
  }

  onMounted(() => {
    hydrate()
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

  const scopedProjectId = computed(() => projectId.value)
  const scopedEnvironmentId = computed(() => (projectId.value ? environmentId.value : ''))

  return {
    projectId: scopedProjectId,
    environmentId: scopedEnvironmentId,
    setProject,
    setEnvironment,
    hydrated,
  }
}
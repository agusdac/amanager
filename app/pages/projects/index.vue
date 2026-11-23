<script setup lang="ts">
const { t } = useI18n()
useAppPageTitle('pageTitles.projects')
const { data: session } = useSessionFetch()
const { projectId, hydrated } = useWorkspaceScope()
const { data, pending } = await useFetch('/api/projects')

const projects = computed(() => data.value?.projects ?? [])

const focusedProjectId = computed(() => {
  if (!hydrated.value || pending.value || !projectId.value) return null
  const exists = projects.value.some((p) => p.id === projectId.value)
  return exists ? projectId.value : null
})

watch(
  focusedProjectId,
  (id) => {
    if (id) navigateTo(`/projects/${id}`, { replace: true })
  },
  { immediate: true },
)

const { data: personalProjects } = await useFetch('/api/me/personal-projects')

const showImportFromPersonal = computed(
  () =>
    session.value?.user?.workspaceType === 'team' &&
    session.value.user.workspaceRole !== 'viewer' &&
    Boolean(personalProjects.value?.workspaceId),
)
</script>

<template>
  <div v-if="!focusedProjectId" class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="page-title">{{ t('projects.title') }}</h1>
        <p class="lede">{{ t('app.tagline') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-if="showImportFromPersonal"
          to="/projects/import-personal"
          class="btn-secondary"
        >
          {{ t('projectCopy.importFromPersonal') }}
        </NuxtLink>
        <NuxtLink to="/projects/new" class="btn-primary">
          {{ t('projects.new') }}
        </NuxtLink>
      </div>
    </div>

    <p v-if="pending" class="lede">{{ t('common.loading') }}</p>
    <p v-else-if="!projects.length" class="lede">{{ t('projects.empty') }}</p>
    <ul v-else class="list-card">
      <li v-for="project in projects" :key="project.id">
        <NuxtLink :to="`/projects/${project.id}`" class="block px-4 py-3 hover:bg-surface-muted">
          <span class="font-medium text-ink">{{ project.name }}</span>
          <span v-if="project.websiteUrl" class="ml-2 text-sm text-subtle">{{ project.websiteUrl }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
  <p v-else class="lede">{{ t('common.loading') }}</p>
</template>
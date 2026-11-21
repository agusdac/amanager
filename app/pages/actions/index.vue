<script setup lang="ts">
const { t } = useI18n()
useAppPageTitle('pageTitles.actions')

const { projectId } = useWorkspaceScope()
const filter = ref<'all' | 'project' | 'asset' | 'workspace'>('all')

const { data: pack } = await useFetch<{ actions: Array<{
  id: string
  assetId: string | null
  projectId: string | null
}> }>('/api/actions')

const listUrl = computed(() => {
  const params = new URLSearchParams()
  if (filter.value === 'workspace') {
    params.set('anchor', 'workspace')
  } else if (projectId.value) {
    params.set('projectId', projectId.value)
  }
  const q = params.toString()
  return q ? `/api/actions?${q}` : '/api/actions'
})

watch(projectId, () => {
  if (projectId.value && filter.value === 'workspace') filter.value = 'all'
})

const filterNote = computed(() => {
  if (filter.value === 'all') return ''
  const total = pack.value?.actions?.length ?? 0
  const filtered = (pack.value?.actions ?? []).filter((a) => {
    if (filter.value === 'project') return a.projectId && !a.assetId
    if (filter.value === 'asset') return Boolean(a.assetId)
    if (filter.value === 'workspace') return !a.projectId && !a.assetId
    return true
  }).length
  return t('actions.filterCount', { filtered, total })
})

const newActionHref = computed(() => {
  const q = new URLSearchParams()
  if (projectId.value) q.set('projectId', projectId.value)
  return q.toString() ? `/actions/new?${q}` : '/actions/new'
})

const route = useRoute()

watch(
  () => route.query.openAction,
  (openAction) => {
    if (typeof openAction === 'string' && openAction) void navigateTo(`/actions/${openAction}`)
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="page-title">{{ t('actions.workspaceTitle') }}</h1>
        <p class="text-sm text-muted">{{ t('actions.workspaceHint') }}</p>
        <ProjectScopeBanner />
      </div>
      <NuxtLink :to="newActionHref" class="btn-primary text-sm shrink-0">{{ t('actions.add') }}</NuxtLink>
    </header>

    <div v-if="!projectId" class="flex flex-wrap gap-2 text-sm" role="tablist">
      <button
        v-for="chip in ['all', 'project', 'asset', 'workspace'] as const"
        :key="chip"
        type="button"
        class="filter-pill"
        :class="filter === chip ? 'filter-pill--active' : ''"
        @click="filter = chip"
      >
        {{ t(`actions.filters.${chip}`) }}
      </button>
    </div>
    <p v-if="filter !== 'all' && filterNote" class="text-xs text-subtle">{{ filterNote }}</p>

    <ActionsPanel
      :list-url="listUrl"
      :list-filter="projectId ? 'all' : filter"
      :fixed-project-id="projectId || undefined"
      :show-header="false"
    />
  </div>
</template>
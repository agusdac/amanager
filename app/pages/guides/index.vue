<script setup lang="ts">
const { t } = useI18n()
const { projectId } = useWorkspaceScope()

useAppPageTitle('pageTitles.guides')

const projectFilter = computed(() => projectId.value || undefined)

const query = computed(() => (projectFilter.value ? `?projectId=${projectFilter.value}` : ''))

const { data, pending, refresh } = await useFetch('/api/runbooks', {
  query: computed(() => (projectFilter.value ? { projectId: projectFilter.value } : {})),
})

watch(projectId, () => refresh())

const { data: templateCatalog } = await useFetch('/api/runbook-templates')

type CatalogTemplate = {
  slug: string
  scope?: 'system' | 'workspace'
}

const systemTemplates = computed(() =>
  (templateCatalog.value?.templates ?? []).filter((tpl: CatalogTemplate) => tpl.scope !== 'workspace'),
)
const workspaceTemplates = computed(() =>
  (templateCatalog.value?.templates ?? []).filter((tpl: CatalogTemplate) => tpl.scope === 'workspace'),
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="page-title">{{ t('guides.listTitle') }}</h1>
        <p class="lede">{{ t('guides.listSubtitle') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="`/guides/templates/workspace`" class="btn-secondary">{{ t('guides.templates.createWorkspace') }}</NuxtLink>
        <NuxtLink :to="`/guides/new${query}`" class="btn-primary">{{ t('guides.newFromTemplate') }}</NuxtLink>
      </div>
    </div>

    <section v-if="workspaceTemplates.length" class="space-y-3">
      <h2 class="text-sm font-medium uppercase tracking-wide text-subtle">
        {{ t('guides.templates.workspaceSection') }}
      </h2>
      <div class="grid gap-4 md:grid-cols-3">
        <RunbookTemplateCard
          v-for="tpl in workspaceTemplates"
          :key="tpl.slug"
          :template="tpl"
          :create-query="query.replace('?', '&')"
        />
      </div>
    </section>

    <section v-if="systemTemplates.length" class="space-y-3">
      <h2 class="text-sm font-medium uppercase tracking-wide text-subtle">
        {{ t('guides.templates.browseAll') }}
      </h2>
      <div class="grid gap-4 md:grid-cols-3">
        <RunbookTemplateCard
          v-for="tpl in systemTemplates"
          :key="tpl.slug"
          :template="tpl"
          :create-query="query.replace('?', '&')"
        />
      </div>
    </section>

    <h2 class="text-sm font-medium uppercase tracking-wide text-subtle">{{ t('guides.yourRunbooks') }}</h2>

    <p v-if="pending" class="text-sm text-subtle">{{ t('common.loading') }}</p>

    <div v-else-if="!data?.runbooks?.length" class="card p-6 text-sm text-muted">
      {{ t('guides.empty') }}
    </div>

    <ul v-else class="space-y-3">
      <li v-for="rb in data.runbooks" :key="rb.id" class="card p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <NuxtLink :to="`/guides/${rb.id}`" class="text-lg font-medium text-ink underline">
              {{ rb.title }}
            </NuxtLink>
            <p class="mt-1 text-sm text-muted">
              {{ rb.projectName }}
              <span v-if="rb.templateSlug" class="text-faint">· {{ rb.templateSlug }}</span>
            </p>
            <p v-if="rb.activeExecution" class="mt-2 text-xs text-amber-800">
              {{ t('guides.executionInProgress') }}
            </p>
          </div>
          <span class="rounded-full bg-surface-soft px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
            {{ rb.status }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

useAppPageTitle('pageTitles.guidesTemplates')

const projectQuery =
  typeof route.query.projectId === 'string' ? `&projectId=${route.query.projectId}` : ''

const { data, pending } = await useFetch('/api/runbook-templates')
</script>

<template>
  <div class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <p class="text-sm">
        <NuxtLink to="/guides" class="text-muted underline">{{ t('guides.templates.backToGuides') }}</NuxtLink>
      </p>
      <h1 class="page-title mt-2">{{ t('guides.templates.catalogTitle') }}</h1>
      <p class="lede">{{ t('guides.templates.catalogSubtitle') }}</p>
    </div>
    <NuxtLink to="/guides/templates/workspace" class="btn-primary text-sm">
      {{ t('guides.templates.createWorkspace') }}
    </NuxtLink>
  </div>

  <AppCallout :title="t('guides.templates.howGenerationWorksTitle')" variant="info">
    {{ t('guides.templates.howGenerationWorksBody') }}
  </AppCallout>

  <p v-if="pending" class="text-sm text-subtle">{{ t('common.loading') }}</p>

  <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <RunbookTemplateCard
      v-for="tpl in data?.templates ?? []"
      :key="tpl.slug"
      :template="tpl"
      :create-query="projectQuery"
    />
  </div>
  </div>
</template>
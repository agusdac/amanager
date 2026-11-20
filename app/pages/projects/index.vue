<script setup lang="ts">
const { t } = useI18n()
useAppPageTitle('pageTitles.projects')
const { data, refresh, pending } = await useFetch('/api/projects')
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="page-title">{{ t('projects.title') }}</h1>
        <p class="lede">{{ t('app.tagline') }}</p>
      </div>
      <NuxtLink
        to="/projects/new"
        class="btn-primary"
      >
        {{ t('projects.new') }}
      </NuxtLink>
    </div>

    <p v-if="pending" class="lede">{{ t('common.loading') }}</p>
    <p v-else-if="!data?.projects?.length" class="lede">{{ t('projects.empty') }}</p>
    <ul v-else class="list-card">
      <li v-for="project in data.projects" :key="project.id">
        <NuxtLink :to="`/projects/${project.id}`" class="block px-4 py-3 hover:bg-surface-muted">
          <span class="font-medium text-ink">{{ project.name }}</span>
          <span v-if="project.websiteUrl" class="ml-2 text-sm text-subtle">{{ project.websiteUrl }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
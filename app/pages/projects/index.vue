<script setup lang="ts">
const { t } = useI18n()
const { data, refresh, pending } = await useFetch('/api/projects')
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{{ t('projects.title') }}</h1>
        <p class="text-sm text-stone-600">{{ t('app.tagline') }}</p>
      </div>
      <NuxtLink
        to="/projects/new"
        class="rounded bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800"
      >
        {{ t('projects.new') }}
      </NuxtLink>
    </div>

    <p v-if="pending">{{ t('common.loading') }}</p>
    <p v-else-if="!data?.projects?.length" class="text-stone-600">{{ t('projects.empty') }}</p>
    <ul v-else class="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
      <li v-for="project in data.projects" :key="project.id">
        <NuxtLink :to="`/projects/${project.id}`" class="block px-4 py-3 hover:bg-stone-50">
          <span class="font-medium text-stone-900">{{ project.name }}</span>
          <span v-if="project.websiteUrl" class="ml-2 text-sm text-stone-500">{{ project.websiteUrl }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
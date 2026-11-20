<script setup lang="ts">
const { t } = useI18n()
useAppPageTitle('pageTitles.projectImportPersonal')

const { data: session } = useSessionFetch()
const { data, pending, error } = await useFetch('/api/me/personal-projects')

const isTeamWorkspace = computed(() => session.value?.user?.workspaceType === 'team')
</script>

<template>
  <div class="page-stack max-w-2xl space-y-6">
    <header>
      <NuxtLink to="/projects" class="text-sm text-muted underline">
        {{ t('projectCopy.backToProjects') }}
      </NuxtLink>
      <h1 class="page-title mt-2">{{ t('projectCopy.importPersonalTitle') }}</h1>
      <p class="lede">{{ t('projectCopy.importPersonalLede') }}</p>
    </header>

    <p v-if="!isTeamWorkspace" class="notice">
      {{ t('projectCopy.importTeamOnly') }}
    </p>

    <template v-else>
      <p v-if="pending" class="text-sm text-muted">{{ t('common.loading') }}</p>
      <p v-else-if="error" class="error-text">{{ t('common.errorGeneric') }}</p>
      <p v-else-if="!data?.projects?.length" class="text-sm text-subtle">
        {{ t('projectCopy.importPersonalEmpty') }}
      </p>
      <ul v-else class="list-card text-sm">
        <li v-for="project in data.projects" :key="project.id">
          <NuxtLink
            :to="`/projects/${project.id}/copy`"
            class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface-muted"
          >
            <span class="font-medium text-ink">{{ project.name }}</span>
            <span class="text-subtle">{{ t('projectCopy.importPickContinue') }}</span>
          </NuxtLink>
        </li>
      </ul>
    </template>
  </div>
</template>
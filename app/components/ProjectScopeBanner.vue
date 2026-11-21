<script setup lang="ts">
const { projectId } = useWorkspaceScope()
const { data: projects } = await useFetch('/api/projects')

const projectName = computed(() => {
  if (!projectId.value) return ''
  return projects.value?.projects?.find((p) => p.id === projectId.value)?.name ?? ''
})
</script>

<template>
  <p v-if="projectId && projectName" class="text-sm text-muted">
    {{ $t('workspaceScope.filteredByProjectNamed', { name: projectName }) }}
  </p>
</template>
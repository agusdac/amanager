<script setup lang="ts">
const { t } = useI18n()
const name = ref('')
const websiteUrl = ref('')
const description = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const { project } = await $fetch('/api/projects', {
      method: 'POST',
      body: {
        name: name.value,
        websiteUrl: websiteUrl.value || undefined,
        description: description.value || undefined,
      },
    })
    await navigateTo(`/projects/${project.id}`)
  } catch {
    error.value = 'Could not create project'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <h1 class="text-2xl font-semibold">{{ t('projects.create') }}</h1>
    <form class="space-y-4 rounded-lg border border-stone-200 bg-white p-6" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="text-stone-600">{{ t('projects.name') }}</span>
        <input v-model="name" required class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
      </label>
      <label class="block text-sm">
        <span class="text-stone-600">{{ t('projects.website') }}</span>
        <input v-model="websiteUrl" type="url" class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
      </label>
      <label class="block text-sm">
        <span class="text-stone-600">{{ t('projects.description') }}</span>
        <textarea v-model="description" rows="3" class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button type="submit" class="rounded bg-stone-900 px-4 py-2 text-white" :disabled="loading">
        {{ t('projects.create') }}
      </button>
    </form>
  </div>
</template>
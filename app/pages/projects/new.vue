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
    error.value = t('projects.createError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="page-title">{{ t('projects.create') }}</h1>
    <form class="card space-y-4 p-6 shadow-sm" @submit.prevent="submit">
      <label class="block">
        <span class="label">{{ t('projects.name') }}</span>
        <input v-model="name" required class="field mt-1.5" />
      </label>
      <label class="block">
        <span class="label">{{ t('projects.website') }}</span>
        <input v-model="websiteUrl" type="url" class="field mt-1.5" />
      </label>
      <label class="block">
        <span class="label">{{ t('projects.description') }}</span>
        <textarea v-model="description" rows="3" class="field mt-1.5" />
      </label>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button type="submit" class="btn-primary" :disabled="loading">
        {{ t('projects.create') }}
      </button>
    </form>
  </div>
</template>
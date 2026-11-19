<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const email = ref('')
const sent = ref(false)
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: email.value } })
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="text-2xl font-semibold">{{ t('auth.forgotTitle') }}</h1>
    <form v-if="!sent" class="space-y-4 rounded-lg border border-stone-200 bg-white p-6" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="text-stone-600">{{ t('auth.email') }}</span>
        <input v-model="email" type="email" required class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
      </label>
      <button type="submit" class="w-full rounded bg-stone-900 px-4 py-2 text-white" :disabled="loading">
        {{ t('auth.submitForgot') }}
      </button>
    </form>
    <p v-else class="text-sm text-stone-600">Check Mailpit at http://localhost:8025 if this email exists.</p>
  </div>
</template>
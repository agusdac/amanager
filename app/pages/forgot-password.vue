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
    <h1 class="page-title">{{ t('auth.forgotTitle') }}</h1>
    <form v-if="!sent" class="card space-y-4 p-6 shadow-sm" @submit.prevent="submit">
      <label class="block">
        <span class="label">{{ t('auth.email') }}</span>
        <input v-model="email" type="email" required autocomplete="email" class="field mt-1.5" />
      </label>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        {{ loading ? t('common.loading') : t('auth.submitForgot') }}
      </button>
    </form>
    <p v-else class="lede">{{ t('auth.forgotSent') }}</p>
  </div>
</template>
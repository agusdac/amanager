<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshNuxtData('session')
    await navigateTo('/home')
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="text-2xl font-semibold">{{ t('auth.loginTitle') }}</h1>
    <form class="space-y-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="text-stone-600">{{ t('auth.email') }}</span>
        <input v-model="email" type="email" required class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
      </label>
      <label class="block text-sm">
        <span class="text-stone-600">{{ t('auth.password') }}</span>
        <input v-model="password" type="password" required class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button
        type="submit"
        class="w-full rounded bg-stone-900 px-4 py-2 text-white disabled:opacity-60"
        :disabled="loading"
      >
        {{ t('auth.submitLogin') }}
      </button>
    </form>
    <p class="text-sm text-stone-600">
      {{ t('auth.noAccount') }}
      <NuxtLink to="/register" class="font-medium text-stone-900 underline">{{ t('nav.register') }}</NuxtLink>
    </p>
    <p class="text-sm">
      <NuxtLink to="/forgot-password" class="text-stone-600 underline">{{ t('auth.forgotTitle') }}</NuxtLink>
    </p>
  </div>
</template>
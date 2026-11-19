<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()
useAppPageTitle('pageTitles.login')
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
    <h1 class="page-title">{{ t('auth.loginTitle') }}</h1>
    <form class="card space-y-4 p-6 shadow-sm" @submit.prevent="submit">
      <label class="block">
        <span class="label">{{ t('auth.email') }}</span>
        <input v-model="email" type="email" required autocomplete="email" class="field mt-1.5" />
      </label>
      <label class="block">
        <span class="label">{{ t('auth.password') }}</span>
        <input v-model="password" type="password" required autocomplete="current-password" class="field mt-1.5" />
      </label>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button
        type="submit"
        class="btn-primary w-full"
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
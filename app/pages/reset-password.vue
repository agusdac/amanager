<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
useAppPageTitle('pageTitles.resetPassword')
const route = useRoute()
const password = ref('')
const done = ref(false)
const error = ref('')
const loading = ref(false)

const token = computed(() => String(route.query.token ?? ''))

async function submit() {
  if (!token.value) {
    error.value = t('auth.resetMissing')
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: password.value },
    })
    done.value = true
  } catch {
    error.value = t('auth.resetInvalid')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="page-title">{{ t('auth.resetTitle') }}</h1>
    <form v-if="!done" class="card space-y-4 p-6 shadow-sm" @submit.prevent="submit">
      <label class="block">
        <span class="label">{{ t('auth.password') }}</span>
        <input v-model="password" type="password" required minlength="10" autocomplete="new-password" class="field mt-1.5" />
      </label>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        {{ loading ? t('common.loading') : t('auth.submitReset') }}
      </button>
    </form>
    <p v-else class="lede">
      {{ t('auth.resetDone') }}
      <NuxtLink to="/login" class="font-medium text-stone-900 underline">{{ t('nav.login') }}</NuxtLink>
    </p>
  </div>
</template>
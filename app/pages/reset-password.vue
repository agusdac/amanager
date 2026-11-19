<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const route = useRoute()
const password = ref('')
const done = ref(false)
const error = ref('')
const loading = ref(false)

const token = computed(() => String(route.query.token ?? ''))

async function submit() {
  if (!token.value) {
    error.value = 'Missing token'
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
    error.value = 'Invalid or expired token'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <h1 class="text-2xl font-semibold">{{ t('auth.resetTitle') }}</h1>
    <form v-if="!done" class="space-y-4 rounded-lg border border-stone-200 bg-white p-6" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="text-stone-600">{{ t('auth.password') }}</span>
        <input v-model="password" type="password" required minlength="10" class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button type="submit" class="w-full rounded bg-stone-900 px-4 py-2 text-white" :disabled="loading">
        {{ t('auth.submitReset') }}
      </button>
    </form>
    <p v-else class="text-sm">
      <NuxtLink to="/login" class="underline">{{ t('nav.login') }}</NuxtLink>
    </p>
  </div>
</template>
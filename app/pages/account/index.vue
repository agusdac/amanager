<script setup lang="ts">
useAppPageTitle('account.title')

const { t, locale, setLocale } = useI18n()
const router = useRouter()

const { data, refresh, pending } = await useFetch('/api/me')
const name = ref('')
const localeChoice = ref<'en' | 'es'>('en')
const profileSaving = ref(false)
const profileError = ref('')
const profileSaved = ref(false)

const deleteOpen = ref(false)
const deleteConfirmEmail = ref('')
const deleteLoading = ref(false)
const deleteError = ref('')

watch(
  data,
  (pack) => {
    if (!pack?.user) return
    name.value = pack.user.name
    localeChoice.value = pack.user.locale === 'es' ? 'es' : 'en'
  },
  { immediate: true },
)

async function saveProfile() {
  profileError.value = ''
  profileSaved.value = false
  profileSaving.value = true
  try {
    await $fetch('/api/me', {
      method: 'PATCH',
      body: { name: name.value.trim(), locale: localeChoice.value },
    })
    if (localeChoice.value !== locale.value) await setLocale(localeChoice.value)
    await refreshNuxtData('session')
    await refresh()
    profileSaved.value = true
  } catch (e: unknown) {
    profileError.value = formatApiError(e)
  } finally {
    profileSaving.value = false
  }
}

async function signOut() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshNuxtData('session')
  await router.push('/login')
}

async function confirmDeleteAccount() {
  const expected = data.value?.user?.email ?? ''
  if (deleteConfirmEmail.value.trim().toLowerCase() !== expected.toLowerCase()) {
    deleteError.value = t('account.deleteEmailMismatch')
    return
  }
  deleteLoading.value = true
  deleteError.value = ''
  try {
    await $fetch('/api/me', { method: 'DELETE' })
    deleteOpen.value = false
    await router.push('/login')
  } catch (e: unknown) {
    deleteError.value = formatApiError(e)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div v-if="pending" class="text-stone-600">{{ t('common.loading') }}</div>
  <div v-else-if="data?.user" class="mx-auto max-w-2xl space-y-8">
    <header class="space-y-1">
      <h1 class="page-title">{{ t('account.title') }}</h1>
      <p class="lede">{{ t('account.subtitle') }}</p>
    </header>

    <section class="card p-6">
      <h2 class="section-title">{{ t('account.profileSection') }}</h2>
      <p class="lede mt-1">{{ t('account.profileHint') }}</p>
      <form class="mt-5 space-y-4" @submit.prevent="saveProfile">
        <label class="block text-sm">
          <span class="label">{{ t('account.displayName') }}</span>
          <input v-model="name" required class="field mt-1.5" autocomplete="name" />
        </label>
        <label class="block text-sm">
          <span class="label">{{ t('account.email') }}</span>
          <input :value="data.user.email" class="field mt-1.5 bg-stone-50" disabled />
          <span class="mt-1 block text-xs text-stone-500">{{ t('account.emailHint') }}</span>
        </label>
        <fieldset class="text-sm">
          <legend class="label">{{ t('account.language') }}</legend>
          <div class="mt-2 flex flex-wrap gap-2">
            <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 has-[:checked]:border-stone-800 has-[:checked]:bg-stone-50">
              <input v-model="localeChoice" type="radio" value="en" class="sr-only" />
              <span class="font-medium text-stone-800">English</span>
            </label>
            <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 has-[:checked]:border-stone-800 has-[:checked]:bg-stone-50">
              <input v-model="localeChoice" type="radio" value="es" class="sr-only" />
              <span class="font-medium text-stone-800">Español</span>
            </label>
          </div>
          <p class="mt-2 text-xs text-stone-500">{{ t('account.languageHint') }}</p>
        </fieldset>
        <p v-if="profileError" class="error-text">{{ profileError }}</p>
        <p v-else-if="profileSaved" class="text-sm text-emerald-700">{{ t('account.saved') }}</p>
        <button type="submit" class="btn-primary" :disabled="profileSaving">
          {{ t('common.save') }}
        </button>
      </form>
    </section>

    <section class="card p-6">
      <h2 class="section-title">{{ t('nav.logout') }}</h2>
      <p class="lede mt-1">{{ t('account.signOutHint') }}</p>
      <button type="button" class="btn-secondary mt-4" @click="signOut">
        {{ t('nav.logout') }}
      </button>
    </section>

    <AppDangerZone :title="t('account.dangerTitle')" :description="t('account.deleteHint')">
      <button type="button" class="btn-danger" @click="deleteOpen = true">
        {{ t('account.deleteButton') }}
      </button>
    </AppDangerZone>

    <AppConfirmDialog
      v-model:open="deleteOpen"
      :title="t('account.deleteTitle')"
      :description="t('account.deleteDescription')"
      :confirm-label="t('account.deleteConfirmAction')"
      :auto-close="false"
      @confirm="confirmDeleteAccount"
    >
      <label class="block text-sm">
        <span class="label">{{ t('account.deleteConfirmLabel') }}</span>
        <input
          v-model="deleteConfirmEmail"
          class="field mt-1.5"
          type="email"
          autocomplete="off"
          :placeholder="data.user.email"
        />
      </label>
      <p v-if="deleteError" class="error-text mt-2">{{ deleteError }}</p>
    </AppConfirmDialog>
  </div>
</template>
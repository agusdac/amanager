<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t, locale, setLocale } = useI18n()
const { setTheme } = useAppTheme()
const route = useRoute()
useAppPageTitle('pageTitles.register')

const { data: authConfig } = await useFetch('/api/auth/config')
const inviteToken = computed(() => (typeof route.query.invite === 'string' ? route.query.invite : ''))

const { data: inviteMeta } = await useFetch(() =>
  inviteToken.value ? `/api/invites/accept?token=${encodeURIComponent(inviteToken.value)}` : null,
)

const registrationOpen = computed(
  () => authConfig.value?.allowPublicRegister === true || !!inviteToken.value,
)

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const localeChoice = ref<'en' | 'es'>('en')
const themeChoice = ref<'light' | 'dark'>('light')
const signupPlan = ref<'personal' | 'team'>('personal')
const teamName = ref('')
const includePersonalWorkspace = ref(false)
const error = ref('')
const loading = ref(false)

watch(
  () => inviteMeta.value?.invite?.email,
  (v) => {
    if (v) email.value = v
  },
  { immediate: true },
)

onMounted(() => {
  localeChoice.value = locale.value === 'es' ? 'es' : 'en'
  if (import.meta.client && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    themeChoice.value = 'dark'
    setTheme('dark')
  } else {
    themeChoice.value = 'light'
  }
})

async function submit() {
  error.value = ''
  if (password.value !== passwordConfirm.value) {
    error.value = t('auth.passwordMismatch')
    return
  }
  loading.value = true
  try {
    const body: Record<string, unknown> = {
      name: name.value,
      email: email.value,
      password: password.value,
      passwordConfirm: passwordConfirm.value,
      locale: localeChoice.value,
      theme: themeChoice.value,
    }
    if (inviteToken.value) {
      body.inviteToken = inviteToken.value
      if (includePersonalWorkspace.value) body.includePersonalWorkspace = true
    } else {
      body.signupPlan = signupPlan.value
      if (signupPlan.value === 'team') body.teamName = teamName.value.trim()
    }

    await $fetch('/api/auth/register', { method: 'POST', body })

    if (localeChoice.value !== locale.value) {
      await setLocale(localeChoice.value)
    }
    setTheme(themeChoice.value)

    await refreshNuxtData('session')
    await navigateTo(inviteToken.value || signupPlan.value === 'team' ? '/team' : '/home')
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <header class="space-y-1">
      <h1 class="page-title">{{ t('auth.registerTitle') }}</h1>
      <p v-if="inviteMeta?.invite" class="lede">
        {{ t('auth.registerInviteHint', { workspace: inviteMeta.invite.workspaceName }) }}
      </p>
      <p v-else class="lede">{{ t('auth.registerLede') }}</p>
    </header>

    <p v-if="!registrationOpen" class="notice text-sm">
      {{ t('auth.registerClosed') }}
      <NuxtLink to="/login" class="underline">{{ t('nav.login') }}</NuxtLink>
      {{ t('auth.registerClosedInviteHint') }}
    </p>

    <form v-if="registrationOpen" class="card space-y-5 p-6 shadow-sm" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="label">{{ t('auth.name') }}</span>
        <input v-model="name" type="text" required autocomplete="name" class="field mt-1.5" />
      </label>

      <label class="block text-sm">
        <span class="label">{{ t('auth.email') }}</span>
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="field mt-1.5"
          :readonly="!!inviteMeta?.invite"
        />
      </label>

      <label class="block text-sm">
        <span class="label">{{ t('auth.password') }}</span>
        <input
          v-model="password"
          type="password"
          required
          minlength="10"
          autocomplete="new-password"
          class="field mt-1.5"
        />
      </label>

      <label class="block text-sm">
        <span class="label">{{ t('auth.passwordConfirm') }}</span>
        <input
          v-model="passwordConfirm"
          type="password"
          required
          minlength="10"
          autocomplete="new-password"
          class="field mt-1.5"
        />
      </label>

      <fieldset v-if="!inviteToken" class="text-sm">
        <legend class="label">{{ t('auth.signupPlanLegend') }}</legend>
        <div class="mt-2 grid gap-2">
          <label class="pref-option w-full">
            <input v-model="signupPlan" type="radio" value="personal" class="sr-only" />
            <span class="pref-option__label block text-left">
              <span class="font-medium">{{ t('auth.signupPlanPersonal') }}</span>
              <span class="mt-0.5 block text-xs font-normal text-subtle">{{ t('auth.signupPlanPersonalHint') }}</span>
            </span>
          </label>
          <label class="pref-option w-full">
            <input v-model="signupPlan" type="radio" value="team" class="sr-only" />
            <span class="pref-option__label block text-left">
              <span class="font-medium">{{ t('auth.signupPlanTeam') }}</span>
              <span class="mt-0.5 block text-xs font-normal text-subtle">{{ t('auth.signupPlanTeamHint') }}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <label v-if="!inviteToken && signupPlan === 'team'" class="block text-sm">
        <span class="label">{{ t('team.name') }}</span>
        <input v-model="teamName" type="text" required autocomplete="organization" class="field mt-1.5" />
      </label>

      <label v-if="inviteToken" class="flex items-start gap-2 text-sm">
        <input v-model="includePersonalWorkspace" type="checkbox" class="mt-1" />
        <span>
          <span class="font-medium text-ink">{{ t('auth.includePersonalLabel') }}</span>
          <span class="mt-0.5 block text-xs text-subtle">{{ t('auth.includePersonalHint') }}</span>
        </span>
      </label>

      <fieldset class="text-sm">
        <legend class="label">{{ t('account.language') }}</legend>
        <div class="mt-2 flex flex-wrap gap-2">
          <label class="pref-option">
            <input v-model="localeChoice" type="radio" value="en" class="sr-only" />
            <span class="pref-option__label">English</span>
          </label>
          <label class="pref-option">
            <input v-model="localeChoice" type="radio" value="es" class="sr-only" />
            <span class="pref-option__label">Español</span>
          </label>
        </div>
      </fieldset>

      <fieldset class="text-sm">
        <legend class="label">{{ t('account.appearance') }}</legend>
        <div class="mt-2 flex flex-wrap gap-2">
          <label class="pref-option">
            <input v-model="themeChoice" type="radio" value="light" class="sr-only" />
            <span class="pref-option__label">{{ t('account.themeLight') }}</span>
          </label>
          <label class="pref-option">
            <input v-model="themeChoice" type="radio" value="dark" class="sr-only" />
            <span class="pref-option__label">{{ t('account.themeDark') }}</span>
          </label>
        </div>
        <p class="mt-2 text-xs text-subtle">{{ t('auth.registerThemeHint') }}</p>
      </fieldset>

      <p v-if="error" class="error-text">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        {{ t('auth.submitRegister') }}
      </button>
    </form>

    <p class="text-sm text-subtle">
      {{ t('auth.hasAccount') }}
      <NuxtLink to="/login" class="font-medium text-ink underline">{{ t('nav.login') }}</NuxtLink>
    </p>
  </div>
</template>
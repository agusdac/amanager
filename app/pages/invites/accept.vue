<script setup lang="ts">
import { Mail, UserPlus, Users } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const { t } = useI18n()

useAppPageTitle('pageTitles.inviteAccept')

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const { data: session, refresh: refreshSession } = useSessionFetch()

const { data: invite, error: inviteError, pending: invitePending } = await useFetch(() =>
  token.value ? `/api/invites/accept?token=${encodeURIComponent(token.value)}` : null,
)

const accepting = ref(false)
const acceptError = ref('')
const switchingAccount = ref(false)

const inviteInfo = computed(() => invite.value?.invite ?? null)

function roleLabel(role: string): string {
  const key = `team.roles.${role}`
  return t(key)
}

const sessionEmail = computed(() => session.value?.user?.email?.toLowerCase() ?? '')
const inviteEmail = computed(() => inviteInfo.value?.email?.toLowerCase() ?? '')
const emailMatches = computed(
  () => !!sessionEmail.value && !!inviteEmail.value && sessionEmail.value === inviteEmail.value,
)
const isSignedIn = computed(() => !!session.value?.user)

const loginTo = computed(() => {
  const q = new URLSearchParams()
  q.set('redirect', route.fullPath)
  if (inviteInfo.value?.email) q.set('email', inviteInfo.value.email)
  return `/login?${q.toString()}`
})

const registerTo = computed(() => `/register?invite=${encodeURIComponent(token.value)}`)

async function accept() {
  if (!token.value || !emailMatches.value) return
  acceptError.value = ''
  accepting.value = true
  try {
    await $fetch('/api/invites/accept', {
      method: 'POST',
      body: { token: token.value },
    })
    await refreshNuxtData()
    await navigateTo('/team')
  } catch (e: unknown) {
    acceptError.value = formatApiError(e)
  } finally {
    accepting.value = false
  }
}

async function useAnotherAccount() {
  switchingAccount.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    await refreshNuxtData('session')
  } finally {
    switchingAccount.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
  <header v-if="inviteInfo && !inviteError" class="space-y-3 text-center">
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 ring-1 ring-stone-200 dark:bg-stone-800 dark:ring-stone-600"
      >
        <Users class="h-6 w-6 text-stone-700 dark:text-stone-200" :stroke-width="1.75" aria-hidden="true" />
      </div>
      <div class="space-y-1">
        <h1 class="page-title">{{ t('invite.acceptTitle') }}</h1>
        <p class="lede mx-auto">{{ t('invite.acceptLede') }}</p>
      </div>
    </header>

    <header v-else class="space-y-1 text-center">
      <h1 class="page-title">{{ t('invite.acceptTitle') }}</h1>
    </header>

    <div v-if="!token" class="callout callout-warning">
      <Mail class="callout-icon" :stroke-width="1.75" aria-hidden="true" />
      <div class="callout-body">
        <p class="callout-title">{{ t('invite.missingTokenTitle') }}</p>
        <p class="text-sm text-subtle">{{ t('invite.missingToken') }}</p>
      </div>
    </div>

    <div v-else-if="invitePending" class="card p-8 text-center text-sm text-subtle">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="inviteError" class="card space-y-4 p-6 text-center shadow-sm">
      <p class="font-medium text-ink">{{ t('invite.invalidTitle') }}</p>
      <p class="text-sm text-subtle">{{ t('invite.invalid') }}</p>
      <NuxtLink to="/login" class="btn-secondary inline-flex">{{ t('nav.login') }}</NuxtLink>
    </div>

    <template v-else-if="inviteInfo">
      <section class="card overflow-hidden shadow-sm">
        <div class="border-b border-rule bg-stone-50/90 px-6 py-5 dark:bg-stone-900/80">
          <p class="text-xs font-semibold uppercase tracking-wide text-subtle">{{ t('invite.workspaceLabel') }}</p>
          <p class="mt-1 text-xl font-semibold text-ink">{{ inviteInfo.workspaceName }}</p>
        </div>
        <dl class="divide-y divide-rule px-6 py-1 text-sm">
          <div class="flex items-center justify-between gap-4 py-3">
            <dt class="text-subtle">{{ t('invite.roleLabel') }}</dt>
            <dd>
              <span
                class="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-600"
              >
                {{ roleLabel(inviteInfo.role) }}
              </span>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-3">
            <dt class="text-subtle">{{ t('invite.invitedEmail') }}</dt>
            <dd class="truncate font-medium text-ink">{{ inviteInfo.email }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="!isSignedIn" class="card space-y-4 p-6 shadow-sm">
        <div class="flex gap-3">
          <UserPlus class="mt-0.5 h-5 w-5 shrink-0 text-subtle" :stroke-width="1.75" aria-hidden="true" />
          <div class="space-y-1">
            <p class="font-medium text-ink">{{ t('invite.guestTitle') }}</p>
            <p class="text-sm text-subtle">{{ t('invite.guestHint') }}</p>
          </div>
        </div>
        <NuxtLink :to="registerTo" class="btn-primary flex w-full justify-center">
          {{ t('invite.createAccount') }}
        </NuxtLink>
        <NuxtLink :to="loginTo" class="btn-secondary flex w-full justify-center">
          {{ t('invite.signIn') }}
        </NuxtLink>
      </section>

      <section v-else-if="!emailMatches" class="callout callout-warning">
        <Mail class="callout-icon" :stroke-width="1.75" aria-hidden="true" />
        <div class="callout-body space-y-3">
          <p class="callout-title">{{ t('invite.wrongAccountTitle') }}</p>
          <p class="text-sm text-subtle">
            {{ t('invite.wrongAccountHint', { current: session?.user?.email, invited: inviteInfo.email }) }}
          </p>
          <div class="callout-actions">
            <button
              type="button"
              class="btn-secondary"
              :disabled="switchingAccount"
              @click="useAnotherAccount"
            >
              {{ t('invite.switchAccount') }}
            </button>
            <NuxtLink :to="loginTo" class="btn-primary">{{ t('invite.signIn') }}</NuxtLink>
          </div>
        </div>
      </section>

      <section v-else class="card space-y-4 p-6 shadow-sm">
        <p class="text-sm text-subtle">{{ t('invite.signedInAs', { email: session?.user?.email }) }}</p>
        <p v-if="acceptError" class="error-text">{{ acceptError }}</p>
        <button type="button" class="btn-primary w-full" :disabled="accepting" @click="accept">
          {{ t('invite.accept') }}
        </button>
        <button
          type="button"
          class="btn-secondary w-full text-sm"
          :disabled="switchingAccount"
          @click="useAnotherAccount"
        >
          {{ t('invite.switchAccount') }}
        </button>
      </section>
    </template>
  </div>
</template>
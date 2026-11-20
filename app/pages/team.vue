<script setup lang="ts">
import { Link, Users } from 'lucide-vue-next'
import type { DetailTabItem } from '~/components/AppDetailTabs'

useAppPageTitle('pageTitles.team')

const { t, locale } = useI18n()
const { auditActionLabel } = useAuditActionLabel()
const { data: session } = useSessionFetch()
const { switchWorkspace } = useWorkspaceSwitch()
const { data: workspacesList, refresh: refreshWorkspaces } = await useFetch('/api/me/workspaces')
const hasPersonalWorkspace = computed(() =>
  (workspacesList.value?.workspaces ?? []).some((w) => w.type === 'personal'),
)
const anotherTeamName = ref('')
const creatingAnother = ref(false)
const createAnotherError = ref('')
const workspaceId = computed(() => session.value?.user?.workspaceId)
const workspaceName = computed(() => session.value?.user?.workspaceName ?? '')
const role = computed(() => session.value?.user?.workspaceRole ?? 'viewer')
const isTeam = computed(() => session.value?.user?.workspaceType === 'team')
const canAdmin = computed(() => role.value === 'admin' || role.value === 'owner')

const inviteEmail = ref('')
const inviteRole = ref<'viewer' | 'editor' | 'admin'>('editor')
const teamName = ref('')
const creating = ref(false)
const createError = ref('')
const inviting = ref(false)
const inviteError = ref('')

function roleLabel(r: string): string {
  const key = `team.roles.${r}`
  return t(key)
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(locale.value === 'es' ? 'es' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const requestFetch = useRequestFetch()

async function load() {
  if (!session.value?.user || !workspaceId.value || !isTeam.value) {
    return { members: [], invites: [], events: [] }
  }

  const membersRes = await requestFetch<{ members: unknown[] }>(
    `/api/workspaces/${workspaceId.value}/members`,
  )

  if (!canAdmin.value) {
    return { members: membersRes.members, invites: [], events: [] }
  }

  const ws = workspaceId.value
  const [invitesSettled, auditSettled] = await Promise.allSettled([
    requestFetch<{ invites: unknown[] }>(`/api/workspaces/${ws}/invites`),
    requestFetch<{ events: unknown[] }>(`/api/workspaces/${ws}/audit-events`),
  ])

  const invites =
    invitesSettled.status === 'fulfilled' ? invitesSettled.value.invites : []
  const events = auditSettled.status === 'fulfilled' ? auditSettled.value.events : []

  return { members: membersRes.members, invites, events }
}

const { data, refresh, pending } = await useAsyncData('team-settings', load, {
  watch: [() => session.value?.user?.id, workspaceId, canAdmin, isTeam],
})

const teamTabs = computed<DetailTabItem[]>(() => {
  const tabs: DetailTabItem[] = [{ id: 'members', label: t('team.tabs.members') }]
  if (canAdmin.value) {
    tabs.push(
      { id: 'invites', label: t('team.tabs.invites') },
      { id: 'activity', label: t('team.tabs.activity') },
    )
  }
  return tabs
})

async function sendInvite() {
  if (!workspaceId.value || !inviteEmail.value.trim() || inviting.value) return
  inviteError.value = ''
  inviting.value = true
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/invites`, {
      method: 'POST',
      body: { email: inviteEmail.value.trim(), role: inviteRole.value },
    })
    inviteEmail.value = ''
    await refresh()
  } catch (e: unknown) {
    inviteError.value = formatApiError(e)
  } finally {
    inviting.value = false
  }
}

async function createTeamWorkspace(name: string, state: 'first' | 'another') {
  const trimmed = name.trim()
  if (!trimmed) return
  const isFirst = state === 'first'
  if (isFirst ? creating.value : creatingAnother.value) return
  if (isFirst) createError.value = ''
  else createAnotherError.value = ''
  if (isFirst) creating.value = true
  else creatingAnother.value = true
  try {
    const res = await $fetch<{ workspace: { id: string } }>('/api/workspaces', {
      method: 'POST',
      body: { name: trimmed },
    })
    if (isFirst) teamName.value = ''
    else anotherTeamName.value = ''
    await refreshWorkspaces()
    await switchWorkspace(res.workspace.id)
  } catch (e: unknown) {
    const msg = formatApiError(e)
    if (isFirst) createError.value = msg
    else createAnotherError.value = msg
  } finally {
    if (isFirst) creating.value = false
    else creatingAnother.value = false
  }
}

async function createTeam() {
  await createTeamWorkspace(teamName.value, 'first')
}

async function createAnotherTeam() {
  await createTeamWorkspace(anotherTeamName.value, 'another')
}

const memberCount = computed(() => data.value?.members?.length ?? 0)
</script>

<template>
  <div v-if="pending && isTeam" class="text-subtle">{{ t('common.loading') }}</div>

  <div v-else class="mx-auto max-w-2xl space-y-8">
    <header class="space-y-1">
      <h1 class="page-title">
        {{ isTeam ? workspaceName : t('team.title') }}
      </h1>
      <p class="lede">
        {{ isTeam ? t('team.subtitleTeam', { name: workspaceName }) : t('team.createHint') }}
      </p>
      <p v-if="isTeam" class="text-xs text-subtle">
        {{ t('team.yourRole', { role: roleLabel(role) }) }}
      </p>
    </header>

    <section
      v-if="isTeam && !hasPersonalWorkspace"
      class="callout callout-info"
    >
      <Link class="callout-icon h-5 w-5" :stroke-width="1.75" aria-hidden="true" />
      <div class="callout-body text-sm">
        <p class="callout-title">{{ t('team.noPersonalTitle') }}</p>
        <p class="text-subtle">
          {{ t('team.noPersonalHint') }}
          <NuxtLink to="/account" class="font-medium text-ink underline">
            {{ t('team.noPersonalLink') }}
          </NuxtLink>
        </p>
      </div>
    </section>

    <section v-if="!isTeam && hasPersonalWorkspace" class="card p-6 shadow-sm">
      <h2 class="section-title">{{ t('team.create') }}</h2>
      <p class="lede mt-1">{{ t('team.createSubtitle') }}</p>
      <form class="mt-5 space-y-4" @submit.prevent="createTeam">
        <label class="block text-sm" for="team-name">
          <span class="label">{{ t('team.name') }}</span>
          <input
            id="team-name"
            v-model="teamName"
            class="field mt-1.5"
            type="text"
            autocomplete="organization"
            required
          />
        </label>
        <p v-if="createError" class="error-text">{{ createError }}</p>
        <button type="submit" class="btn-primary" :disabled="creating">
          {{ t('team.create') }}
        </button>
      </form>
    </section>

    <template v-else-if="canAdmin">
      <AppDetailTabs :tabs="teamTabs" default-tab="members" query-key="section">
        <template #members>
          <section class="card overflow-hidden">
            <div class="border-b border-rule px-6 py-4">
              <p class="lede">{{ t('team.membersHint', { count: memberCount }) }}</p>
            </div>
            <ul v-if="data?.members?.length" class="list-card rounded-none border-0">
              <li v-for="m in data.members" :key="m.userId">
                <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div class="min-w-0">
                    <p class="font-medium text-ink">{{ m.name }}</p>
                    <p class="truncate text-sm text-subtle">{{ m.email }}</p>
                  </div>
                  <span
                    class="inline-flex shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-600"
                  >
                    {{ roleLabel(m.role) }}
                  </span>
                </div>
              </li>
            </ul>
            <p v-else class="px-6 py-8 text-sm text-subtle">{{ t('team.emptyMembers') }}</p>
          </section>
        </template>

        <template #invites>
          <div class="space-y-6">
            <section class="card p-6">
              <h2 class="section-title">{{ t('team.invite') }}</h2>
              <p class="lede mt-1">{{ t('team.inviteHint') }}</p>
              <form
                class="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end"
                @submit.prevent="sendInvite"
              >
                <label class="block text-sm">
                  <span class="label">{{ t('team.inviteEmail') }}</span>
                  <input
                    v-model="inviteEmail"
                    class="field mt-1.5"
                    type="email"
                    autocomplete="email"
                    required
                  />
                </label>
                <label class="block text-sm">
                  <span class="label">{{ t('team.inviteRole') }}</span>
                  <select v-model="inviteRole" class="field mt-1.5">
                    <option value="viewer">{{ roleLabel('viewer') }}</option>
                    <option value="editor">{{ roleLabel('editor') }}</option>
                    <option value="admin">{{ roleLabel('admin') }}</option>
                  </select>
                </label>
                <button type="submit" class="btn-primary sm:mb-0.5" :disabled="inviting">
                  {{ t('team.sendInvite') }}
                </button>
              </form>
              <p v-if="inviteError" class="error-text mt-3">{{ inviteError }}</p>
            </section>

            <section class="card overflow-hidden">
              <div class="border-b border-rule px-6 py-4">
                <h2 class="section-title">{{ t('team.pendingInvites') }}</h2>
              </div>
              <ul v-if="data?.invites?.length" class="list-card rounded-none border-0">
                <li v-for="inv in data.invites" :key="inv.id">
                  <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div class="min-w-0">
                      <p class="font-medium text-ink">{{ inv.email }}</p>
                      <p class="text-subtle">
                        {{ roleLabel(inv.role) }}
                        <span v-if="inv.expired" class="text-amber-700 dark:text-amber-400">
                          · {{ t('team.expired') }}
                        </span>
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
              <p v-else class="px-6 py-8 text-sm text-subtle">{{ t('team.emptyInvites') }}</p>
            </section>
          </div>
        </template>

        <template #activity>
          <section class="card overflow-hidden">
            <div class="border-b border-rule px-6 py-4">
              <p class="lede">{{ t('team.activityHint') }}</p>
            </div>
            <ul v-if="data?.events?.length" class="list-card divide-y rounded-none border-0">
              <li v-for="ev in data.events" :key="ev.id">
                <div class="space-y-0.5 px-4 py-3 text-sm">
                  <p class="text-ink">
                    <span class="font-medium">{{ ev.actorName ?? t('team.systemActor') }}</span>
                    <span class="text-subtle"> · {{ auditActionLabel(ev.action) }}</span>
                  </p>
                  <time class="text-xs text-subtle">{{ formatWhen(ev.createdAt) }}</time>
                </div>
              </li>
            </ul>
            <p v-else class="px-6 py-8 text-sm text-subtle">{{ t('team.emptyActivity') }}</p>
          </section>
        </template>
      </AppDetailTabs>

      <section class="card p-6 shadow-sm">
        <h2 class="section-title">{{ t('team.createAnother') }}</h2>
        <p class="lede mt-1">{{ t('team.createAnotherHint') }}</p>
        <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="createAnotherTeam">
          <label class="block min-w-[12rem] flex-1 text-sm">
            <span class="label">{{ t('team.name') }}</span>
            <input v-model="anotherTeamName" class="field mt-1.5" type="text" autocomplete="organization" required />
          </label>
          <button type="submit" class="btn-secondary" :disabled="creatingAnother">
            {{ t('team.createAnotherAction') }}
          </button>
        </form>
        <p v-if="createAnotherError" class="error-text mt-2">{{ createAnotherError }}</p>
      </section>
    </template>

    <template v-else>
      <section class="card overflow-hidden">
        <div class="border-b border-rule px-6 py-4">
          <h2 class="section-title">{{ t('team.tabs.members') }}</h2>
          <p class="lede mt-1">{{ t('team.membersHint', { count: memberCount }) }}</p>
        </div>
        <ul v-if="data?.members?.length" class="list-card rounded-none border-0">
          <li v-for="m in data.members" :key="m.userId">
            <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div class="min-w-0">
                <p class="font-medium text-ink">{{ m.name }}</p>
                <p class="truncate text-sm text-subtle">{{ m.email }}</p>
              </div>
              <span
                class="inline-flex shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-600"
              >
                {{ roleLabel(m.role) }}
              </span>
            </div>
          </li>
        </ul>
        <p v-else class="px-6 py-8 text-sm text-subtle">{{ t('team.emptyMembers') }}</p>
      </section>

      <section class="callout callout-info">
        <Users class="callout-icon" :stroke-width="1.75" aria-hidden="true" />
        <div class="callout-body">
          <p class="callout-title">{{ t('team.invite') }}</p>
          <p class="text-sm text-subtle">{{ t('team.viewerHint') }}</p>
        </div>
      </section>

      <section v-if="isTeam" class="card p-6 shadow-sm">
        <h2 class="section-title">{{ t('team.createAnother') }}</h2>
        <p class="lede mt-1">{{ t('team.createAnotherHint') }}</p>
        <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="createAnotherTeam">
          <label class="block min-w-[12rem] flex-1 text-sm">
            <span class="label">{{ t('team.name') }}</span>
            <input v-model="anotherTeamName" class="field mt-1.5" type="text" required />
          </label>
          <button type="submit" class="btn-secondary" :disabled="creatingAnother">
            {{ t('team.createAnotherAction') }}
          </button>
        </form>
        <p v-if="createAnotherError" class="error-text mt-2">{{ createAnotherError }}</p>
      </section>
    </template>

  </div>
</template>
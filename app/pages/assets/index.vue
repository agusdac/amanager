<script setup lang="ts">
import { VERIFICATION_STATUS_KEYS } from '~/constants/inventory'

type VerificationFilter = '' | 'needs_confirmation' | (typeof VERIFICATION_STATUS_KEYS)[number]

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

useAppPageTitle('pageTitles.assets')

const q = ref('')
const page = ref(1)

const verificationFilter = computed<VerificationFilter>(() => {
  const v = route.query.verification
  if (v === 'needs_confirmation') return 'needs_confirmation'
  if (typeof v === 'string' && (VERIFICATION_STATUS_KEYS as readonly string[]).includes(v)) {
    return v as VerificationFilter
  }
  return ''
})

function setVerificationFilter(value: VerificationFilter) {
  const query = { ...route.query }
  if (value) query.verification = value
  else delete query.verification
  page.value = 1
  router.replace({ query })
}

const projectFilter = computed(() => {
  const p = route.query.projectId
  return typeof p === 'string' ? p : ''
})

const environmentFilter = computed(() => {
  const e = route.query.environmentId
  return typeof e === 'string' ? e : ''
})

const envListUrl = computed(() =>
  projectFilter.value ? `/api/environments?projectId=${projectFilter.value}` : null,
)

const { data: projects } = await useFetch('/api/projects')
const { data: envPack } = await useFetch(envListUrl, { watch: [envListUrl] })

function setProjectFilter(projectId: string) {
  const query = { ...route.query }
  if (projectId) query.projectId = projectId
  else delete query.projectId
  delete query.environmentId
  page.value = 1
  router.replace({ query })
}

function setEnvironmentFilter(environmentId: string) {
  const query = { ...route.query }
  if (!projectFilter.value) return
  if (environmentId) query.environmentId = environmentId
  else delete query.environmentId
  page.value = 1
  router.replace({ query })
}

const fetchUrl = computed(() => {
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  params.set('limit', '25')
  if (q.value.trim()) params.set('q', q.value.trim())
  if (verificationFilter.value) params.set('verification', verificationFilter.value)
  if (projectFilter.value) params.set('projectId', projectFilter.value)
  if (projectFilter.value && environmentFilter.value) params.set('environmentId', environmentFilter.value)
  return `/api/assets?${params.toString()}`
})

const { data } = await useFetch(fetchUrl, { watch: [fetchUrl] })
const { data: identities } = await useFetch('/api/identities')

const impactAssets = computed(() =>
  (data.value?.assets ?? []).map((a: { id: string; name: string }) => ({ id: a.id, label: a.name })),
)
const impactIdentities = computed(() =>
  (identities.value?.identities ?? []).map((i: { id: string; label: string }) => ({
    id: i.id,
    label: i.label,
  })),
)
</script>

<template>
  <div class="space-y-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="page-title">{{ t('assets.inventoryTitle') }}</h1>
        <p v-if="verificationFilter === 'needs_confirmation'" class="text-sm text-stone-600">
          {{ t('assets.verificationQueueHint') }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="q"
          type="search"
          :placeholder="t('assets.search')"
          class="field w-auto sm:w-64"
          @input="page = 1"
        />
        <a href="/api/export/assets" class="btn-secondary">
          {{ t('assets.export') }}
        </a>
      </div>
    </header>

    <div class="flex flex-wrap items-end gap-3 text-sm">
      <label class="block">
        <span class="label text-xs">{{ t('assets.filterProject') }}</span>
        <select
          class="field mt-1 w-auto min-w-[10rem]"
          :value="projectFilter"
          @change="setProjectFilter(($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('assets.filterProjectAll') }}</option>
          <option v-for="p in projects?.projects ?? []" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </label>
      <label v-if="projectFilter" class="block">
        <span class="label text-xs">{{ t('assets.filterEnvironment') }}</span>
        <select
          class="field mt-1 w-auto min-w-[10rem]"
          :value="environmentFilter"
          @change="setEnvironmentFilter(($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('assets.filterEnvironmentAll') }}</option>
          <option value="_none">{{ t('assets.filterEnvironmentUnset') }}</option>
          <option v-for="env in envPack?.environments ?? []" :key="env.id" :value="env.id">
            {{ env.name }}
          </option>
        </select>
      </label>
    </div>

    <div class="flex flex-wrap gap-2 text-sm">
      <button
        type="button"
        class="rounded-full border px-3 py-1 transition-colors"
        :class="verificationFilter === '' ? 'border-stone-800 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'"
        @click="setVerificationFilter('')"
      >
        {{ t('assets.verificationFilter.all') }}
      </button>
      <button
        type="button"
        class="rounded-full border px-3 py-1 transition-colors"
        :class="verificationFilter === 'needs_confirmation' ? 'border-stone-800 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'"
        @click="setVerificationFilter('needs_confirmation')"
      >
        {{ t('assets.verificationFilter.needsConfirmation') }}
      </button>
      <button
        type="button"
        class="rounded-full border px-3 py-1 transition-colors"
        :class="verificationFilter === 'confirmed_by_human' ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'"
        @click="setVerificationFilter('confirmed_by_human')"
      >
        {{ t('assets.verificationFilter.confirmed') }}
      </button>
    </div>

    <div class="card overflow-x-auto">
      <table class="w-full min-w-[32rem] text-left text-sm">
        <thead class="border-b bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th class="px-4 py-3">{{ t('assets.name') }}</th>
            <th class="px-4 py-3">{{ t('assets.type') }}</th>
            <th class="px-4 py-3">{{ t('assets.provider') }}</th>
            <th class="px-4 py-3">{{ t('assets.verification') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in data?.assets" :key="a.id" class="border-b border-stone-100">
            <td class="px-4 py-3 font-medium">
              <NuxtLink :to="`/assets/${a.id}`" class="text-stone-900 hover:underline">{{ a.name }}</NuxtLink>
            </td>
            <td class="px-4 py-3 text-stone-700">
              <AssetTypeLabel :type="a.type" :provider-slug="a.providerSlug" show-description />
            </td>
            <td class="px-4 py-3 text-stone-600">{{ a.providerName ?? '—' }}</td>
            <td class="px-4 py-3">
              <NuxtLink :to="`/assets/${a.id}?tab=verifications`" class="inline-block hover:opacity-90">
                <VerificationChip :status="a.verificationStatus" />
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!data?.assets?.length" class="px-4 py-8 text-center text-sm text-stone-500">{{ t('assets.empty') }}</p>
    </div>

    <ImpactExplorer :asset-options="impactAssets" :identity-options="impactIdentities" />
  </div>
</template>
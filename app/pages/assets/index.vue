<script setup lang="ts">
import { VERIFICATION_STATUS_KEYS } from '~/constants/inventory'

type VerificationFilter = '' | 'needs_confirmation' | (typeof VERIFICATION_STATUS_KEYS)[number]

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { projectId, environmentId, setEnvironment } = useWorkspaceScope()

const envListUrl = computed(() => (projectId.value ? `/api/environments?projectId=${projectId.value}` : null))
const { data: envPack } = await useFetch(envListUrl, { watch: [envListUrl] })

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

const scopedParams = computed(() => {
  const params = new URLSearchParams()
  if (projectId.value) params.set('projectId', projectId.value)
  if (projectId.value && environmentId.value) params.set('environmentId', environmentId.value)
  return params
})

const fetchUrl = computed(() => {
  const params = new URLSearchParams(scopedParams.value)
  params.set('page', String(page.value))
  params.set('limit', '25')
  if (q.value.trim()) params.set('q', q.value.trim())
  if (verificationFilter.value) params.set('verification', verificationFilter.value)
  return `/api/assets?${params.toString()}`
})

const impactListUrl = computed(() => {
  const params = new URLSearchParams(scopedParams.value)
  params.set('limit', '100')
  return `/api/assets?${params.toString()}`
})

const { data } = await useFetch(fetchUrl, { watch: [fetchUrl] })
const { data: impactAssetPack } = await useFetch(impactListUrl, { watch: [impactListUrl] })
const { data: identities } = await useFetch('/api/identities')

watch([projectId, environmentId], () => {
  page.value = 1
})

const impactAssets = computed(() =>
  (impactAssetPack.value?.assets ?? []).map((a: { id: string; name: string }) => ({ id: a.id, label: a.name })),
)
const impactIdentities = computed(() =>
  (identities.value?.identities ?? []).map((i: { id: string; label: string }) => ({
    id: i.id,
    label: i.label,
  })),
)

const assetTabs = computed(() => [
  { id: 'inventory', label: t('tabs.assets.inventory') },
  { id: 'impact', label: t('tabs.assets.impact') },
])
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="page-title">{{ t('assets.inventoryTitle') }}</h1>
        <p v-if="verificationFilter === 'needs_confirmation'" class="text-sm text-muted">
          {{ t('assets.verificationQueueHint') }}
        </p>
        <p v-else class="text-sm text-muted">{{ t('assets.inventorySubtitle') }}</p>
        <label v-if="projectId" class="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span class="text-xs font-medium uppercase tracking-wide text-subtle">{{ t('assets.filterEnvironment') }}</span>
          <select
            class="field w-auto min-w-[10rem] py-1.5"
            :value="environmentId"
            @change="setEnvironment(($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ t('assets.filterEnvironmentAll') }}</option>
            <option value="_none">{{ t('assets.filterEnvironmentUnset') }}</option>
            <option v-for="env in envPack?.environments ?? []" :key="env.id" :value="env.id">
              {{ env.name }}
            </option>
          </select>
        </label>
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

    <AppDetailTabs :tabs="assetTabs" default-tab="inventory">
      <template #inventory>
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2 text-sm" role="tablist" :aria-label="t('assets.verificationFilterLabel')">
            <button
              type="button"
              role="tab"
              class="filter-pill"
              :class="verificationFilter === '' ? 'filter-pill--active' : ''"
              :aria-selected="verificationFilter === ''"
              @click="setVerificationFilter('')"
            >
              {{ t('assets.verificationFilter.all') }}
            </button>
            <button
              type="button"
              role="tab"
              class="filter-pill"
              :class="verificationFilter === 'needs_confirmation' ? 'filter-pill--active' : ''"
              :aria-selected="verificationFilter === 'needs_confirmation'"
              @click="setVerificationFilter('needs_confirmation')"
            >
              {{ t('assets.verificationFilter.needsConfirmation') }}
            </button>
            <button
              type="button"
              role="tab"
              class="filter-pill"
              :class="verificationFilter === 'confirmed_by_human' ? 'filter-pill--success-active' : ''"
              :aria-selected="verificationFilter === 'confirmed_by_human'"
              @click="setVerificationFilter('confirmed_by_human')"
            >
              {{ t('assets.verificationFilter.confirmed') }}
            </button>
          </div>

          <div class="card overflow-x-auto">
            <table class="w-full min-w-[32rem] text-left text-sm">
              <thead class="table-head">
                <tr>
                  <th class="px-4 py-3">{{ t('assets.name') }}</th>
                  <th class="px-4 py-3">{{ t('assets.type') }}</th>
                  <th class="px-4 py-3">{{ t('assets.provider') }}</th>
                  <th class="px-4 py-3">{{ t('assets.verification') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in data?.assets" :key="a.id" class="border-b border-rule-light">
                  <td class="px-4 py-3 font-medium">
                    <NuxtLink :to="`/assets/${a.id}`" class="text-ink hover:underline">{{ a.name }}</NuxtLink>
                  </td>
                  <td class="px-4 py-3 text-ink-secondary">
                    <AssetTypeLabel :type="a.type" :provider-slug="a.providerSlug" show-description />
                  </td>
                  <td class="px-4 py-3 text-muted">{{ a.providerName ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <NuxtLink :to="`/assets/${a.id}?tab=verifications`" class="inline-block hover:opacity-90">
                      <VerificationChip :status="a.verificationStatus" />
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="!data?.assets?.length" class="px-4 py-8 text-center text-sm text-subtle">{{ t('assets.empty') }}</p>
          </div>
        </div>
      </template>

      <template #impact>
        <ImpactExplorer :asset-options="impactAssets" :identity-options="impactIdentities" embedded />
      </template>
    </AppDetailTabs>
  </div>
</template>
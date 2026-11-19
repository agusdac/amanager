<script setup lang="ts">
const { t } = useI18n()
useAppPageTitle('pageTitles.assets')
const q = ref('')
const page = ref(1)
const { data } = await useFetch(() => `/api/assets?q=${encodeURIComponent(q.value)}&page=${page.value}&limit=25`, {
  watch: [q, page],
})
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
      <h1 class="page-title">{{ t('assets.inventoryTitle') }}</h1>
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
              <VerificationChip :status="a.verificationStatus" />
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!data?.assets?.length" class="px-4 py-8 text-center text-sm text-stone-500">{{ t('assets.empty') }}</p>
    </div>

    <ImpactExplorer :asset-options="impactAssets" :identity-options="impactIdentities" />
  </div>
</template>
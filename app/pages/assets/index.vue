<script setup lang="ts">
const { t } = useI18n()
const q = ref('')
const page = ref(1)
const { data } = await useFetch(() => `/api/assets?q=${encodeURIComponent(q.value)}&page=${page.value}&limit=25`, {
  watch: [q, page],
})

const impactAssetId = ref('')
const impact = ref<{ edges: Array<{ fromName: string; toName: string; relationType: string; verificationStatus: string }> } | null>(null)

async function loadImpact() {
  if (!impactAssetId.value) return
  impact.value = await $fetch(`/api/impact?entityType=asset&entityId=${impactAssetId.value}`)
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">{{ t('assets.inventoryTitle') }}</h1>
    <div class="flex flex-wrap gap-2">
      <input v-model="q" type="search" :placeholder="t('assets.search')" class="rounded border px-3 py-2 text-sm" @input="page = 1" />
      <a href="/api/export/assets" class="rounded border px-3 py-2 text-sm">{{ t('assets.export') }}</a>
    </div>

    <table class="w-full text-left text-sm">
      <thead class="border-b text-stone-500">
        <tr>
          <th class="py-2">{{ t('assets.name') }}</th>
          <th>{{ t('assets.type') }}</th>
          <th>{{ t('assets.provider') }}</th>
          <th>{{ t('assets.verification') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in data?.assets" :key="a.id" class="border-b">
          <td class="py-2 font-medium">{{ a.name }}</td>
          <td>{{ a.type }}</td>
          <td>{{ a.providerName ?? '—' }}</td>
          <td>{{ a.verificationStatus }}</td>
        </tr>
      </tbody>
    </table>

    <section class="rounded-lg border bg-white p-4">
      <h2 class="font-medium">{{ t('assets.impact') }}</h2>
      <p class="text-sm text-stone-600">{{ t('assets.impactHint') }}</p>
      <div class="mt-2 flex gap-2">
        <select v-model="impactAssetId" class="rounded border px-2 py-1 text-sm">
          <option value="">{{ t('assets.pickAsset') }}</option>
          <option v-for="a in data?.assets" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <button type="button" class="rounded border px-3 py-1 text-sm" @click="loadImpact">{{ t('assets.runImpact') }}</button>
      </div>
      <ul v-if="impact?.edges?.length" class="mt-3 space-y-1 text-sm">
        <li v-for="(e, i) in impact.edges" :key="i">
          {{ e.fromName }} → {{ e.toName }} ({{ e.relationType }}, {{ e.verificationStatus }})
        </li>
      </ul>
    </section>
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n()
const q = ref('')
const debouncedQ = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(q, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQ.value = val.trim()
  }, 280)
})

type SearchPayload = {
  assets?: { id: string; name: string; type: string; providerSlug?: string | null }[]
  emails?: { id: string; address: string; linkedAssets?: { id: string; name: string }[] }[]
  identities?: { id: string; label: string; providerName?: string | null }[]
}

const data = ref<SearchPayload | null>(null)
const pending = ref(false)

watch(debouncedQ, async (q) => {
  if (q.length < 2) {
    data.value = null
    return
  }
  pending.value = true
  try {
    data.value = await $fetch<SearchPayload>(`/api/search?q=${encodeURIComponent(q)}`)
  } catch {
    data.value = null
  } finally {
    pending.value = false
  }
})

const hasResults = computed(() => {
  if (!data.value || debouncedQ.value.length < 2) return false
  return (
    (data.value.assets?.length ?? 0) > 0 ||
    (data.value.emails?.length ?? 0) > 0 ||
    (data.value.identities?.length ?? 0) > 0
  )
})
</script>

<template>
  <h2 class="sr-only">{{ t('search.title') }}</h2>
  <label class="block">
    <span class="label">{{ t('search.placeholder') }}</span>
    <input
      v-model="q"
      type="search"
      class="field mt-1.5 w-full"
      :placeholder="t('search.placeholder')"
      autocomplete="off"
    />
  </label>

  <p v-if="pending && debouncedQ.length >= 2" class="mt-2 text-sm text-stone-500">{{ t('common.loading') }}</p>

  <div v-else-if="hasResults" class="mt-4 space-y-4 rounded-xl border border-stone-200 bg-white p-4 text-sm">
    <section v-if="data?.assets?.length">
      <h3 class="text-xs font-medium uppercase tracking-wide text-stone-500">{{ t('nav.assets') }}</h3>
      <ul class="mt-2 space-y-1">
        <li v-for="a in data.assets" :key="a.id">
          <NuxtLink :to="`/assets/${a.id}`" class="font-medium text-stone-900 hover:underline">
            {{ a.name }}
          </NuxtLink>
          <span class="ml-2 text-stone-500">
            <AssetTypeLabel :type="a.type" :provider-slug="a.providerSlug" />
          </span>
        </li>
      </ul>
    </section>
    <section v-if="data?.emails?.length">
      <h3 class="text-xs font-medium uppercase tracking-wide text-stone-500">{{ t('accounts.emails') }}</h3>
      <ul class="mt-2 space-y-2">
        <li v-for="em in data.emails" :key="em.id">
          <span class="font-medium">{{ em.address }}</span>
          <ul v-if="em.linkedAssets?.length" class="ml-3 mt-1 list-inside list-disc text-stone-600">
            <li v-for="asset in em.linkedAssets" :key="asset.id">
              <NuxtLink :to="`/assets/${asset.id}`" class="underline">{{ asset.name }}</NuxtLink>
            </li>
          </ul>
          <NuxtLink v-else to="/accounts" class="ml-2 text-stone-500 underline">{{ t('search.openAccounts') }}</NuxtLink>
        </li>
      </ul>
    </section>
    <section v-if="data?.identities?.length">
      <h3 class="text-xs font-medium uppercase tracking-wide text-stone-500">{{ t('accounts.identities') }}</h3>
      <ul class="mt-2 space-y-1">
        <li v-for="ident in data.identities" :key="ident.id">
          <NuxtLink :to="`/identities/${ident.id}`" class="font-medium text-stone-900 hover:underline">
            {{ ident.label }}
          </NuxtLink>
          <span v-if="ident.providerName" class="ml-2 text-stone-500">{{ ident.providerName }}</span>
        </li>
      </ul>
    </section>
  </div>

  <p v-else-if="debouncedQ.length >= 2 && !pending" class="mt-2 text-sm text-stone-500">{{ t('search.empty') }}</p>
</template>
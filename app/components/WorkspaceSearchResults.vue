<script setup lang="ts">
type SearchPayload = {
  assets?: { id: string; name: string; type: string; providerSlug?: string | null }[]
  emails?: { id: string; address: string; linkedAssets?: { id: string; name: string }[] }[]
  identities?: { id: string; label: string; providerName?: string | null }[]
}

defineProps<{
  data: SearchPayload | null
  pending: boolean
  hasResults: boolean
  debouncedQ: string
}>()

const emit = defineEmits<{ navigate: [] }>()

const { t } = useI18n()
</script>

<template>
  <p v-if="pending" class="px-1 py-2 text-subtle">{{ t('common.loading') }}</p>

  <template v-else-if="hasResults">
    <section v-if="data?.assets?.length" class="space-y-1">
      <h3 class="px-1 text-xs font-medium uppercase tracking-wide text-subtle">{{ t('nav.assets') }}</h3>
      <ul class="space-y-0.5">
        <li v-for="a in data.assets" :key="a.id">
          <NuxtLink
            :to="`/assets/${a.id}`"
            class="block rounded-md px-2 py-1.5 font-medium text-ink hover:bg-stone-100 dark:hover:bg-stone-800"
            @click="emit('navigate')"
          >
            {{ a.name }}
            <span class="ml-2 text-subtle">
              <AssetTypeLabel :type="a.type" :provider-slug="a.providerSlug" dense />
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
    <section v-if="data?.emails?.length" class="mt-3 space-y-1">
      <h3 class="px-1 text-xs font-medium uppercase tracking-wide text-subtle">{{ t('accounts.emails') }}</h3>
      <ul class="space-y-1">
        <li v-for="em in data.emails" :key="em.id">
          <p class="px-2 font-medium">{{ em.address }}</p>
          <ul v-if="em.linkedAssets?.length" class="ml-2 space-y-0.5 border-l border-rule pl-2">
            <li v-for="asset in em.linkedAssets" :key="asset.id">
              <NuxtLink
                :to="`/assets/${asset.id}`"
                class="block rounded-md px-2 py-1 text-muted underline hover:bg-stone-100 dark:hover:bg-stone-800"
                @click="emit('navigate')"
              >
                {{ asset.name }}
              </NuxtLink>
            </li>
          </ul>
          <NuxtLink
            v-else
            to="/accounts"
            class="ml-2 inline-block px-2 py-1 text-subtle underline"
            @click="emit('navigate')"
          >
            {{ t('search.openAccounts') }}
          </NuxtLink>
        </li>
      </ul>
    </section>
    <section v-if="data?.identities?.length" class="mt-3 space-y-1">
      <h3 class="px-1 text-xs font-medium uppercase tracking-wide text-subtle">{{ t('accounts.identities') }}</h3>
      <ul class="space-y-0.5">
        <li v-for="ident in data.identities" :key="ident.id">
          <NuxtLink
            :to="`/identities/${ident.id}`"
            class="block rounded-md px-2 py-1.5 font-medium text-ink hover:bg-stone-100 dark:hover:bg-stone-800"
            @click="emit('navigate')"
          >
            {{ ident.label }}
            <span v-if="ident.providerName" class="ml-2 text-subtle">{{ ident.providerName }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </template>

  <p v-else-if="debouncedQ.length >= 2" class="px-1 py-2 text-subtle">{{ t('search.empty') }}</p>
</template>
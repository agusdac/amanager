<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const id = computed(() => String(route.params.id))

const { data, pending } = await useFetch(() => `/api/identities/${id.value}`, { watch: [id] })

const { data: assetList } = await useFetch('/api/assets?limit=100')
const { data: identities } = await useFetch('/api/identities')

const impactAssets = computed(() =>
  (assetList.value?.assets ?? []).map((a: { id: string; name: string }) => ({ id: a.id, label: a.name })),
)
const impactIdentities = computed(() =>
  (identities.value?.identities ?? []).map((i: { id: string; label: string }) => ({
    id: i.id,
    label: i.label,
  })),
)

const preselectIdentity = computed(() => id.value)
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div v-if="data?.identity" class="space-y-2">
        <h1 class="page-title">{{ data.identity.label }}</h1>
        <p v-if="data.provider?.name" class="lede">{{ data.provider.name }}</p>
        <VerificationChip :status="data.identity.verificationStatus" />
      </div>
      <NuxtLink to="/accounts" class="btn-secondary">
        {{ t('identityDetail.backToAccounts') }}
      </NuxtLink>
    </div>

    <p v-if="pending" class="text-stone-600">{{ t('common.loading') }}</p>

    <template v-else-if="data">
      <section class="card space-y-3 p-5">
        <h2 class="section-title">{{ t('identityDetail.assetsAccess') }}</h2>
        <p class="lede">{{ t('identityDetail.assetsAccessHint') }}</p>
        <ul v-if="data.assetAccess?.length" class="divide-y divide-stone-100 border-t border-stone-100">
          <li
            v-for="row in data.assetAccess"
            :key="row.roleId"
            class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <div>
              <NuxtLink :to="`/assets/${row.assetId}`" class="font-medium text-stone-900 hover:underline">
                {{ row.assetName }}
              </NuxtLink>
              <span class="ml-2 text-stone-500">
                <AssetTypeLabel :type="row.assetType" :provider-slug="row.providerSlug" />
              </span>
              <span class="ml-2 text-stone-500">({{ t(`assets.roles.${row.roleType}`) }})</span>
            </div>
            <VerificationChip :status="row.verificationStatus" />
          </li>
        </ul>
        <p v-else class="mt-4 text-sm text-stone-500">{{ t('identityDetail.noAssets') }}</p>
      </section>

      <section class="card space-y-3 p-5">
        <h2 class="section-title">{{ t('accounts.emails') }}</h2>
        <ul v-if="data.emails?.length" class="divide-y divide-stone-100 border-t border-stone-100">
          <li v-for="(em, i) in data.emails" :key="i" class="px-4 py-2 text-sm">
            <span class="font-medium">{{ em.address }}</span>
            <span class="ml-2 text-stone-500">({{ t(`assets.purposes.${em.purpose}`) }})</span>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-stone-500">{{ t('identityDetail.noEmails') }}</p>
      </section>

      <section
        v-if="data.linkedAccounts?.length"
        class="card space-y-2 bg-stone-50/80 p-5"
      >
        <h2 class="section-title">{{ t('accounts.providerAccounts') }}</h2>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="acc in data.linkedAccounts" :key="acc.accountId">
            {{ acc.label }}
            <span v-if="acc.providerName" class="text-stone-500">({{ acc.providerName }})</span>
          </li>
        </ul>
      </section>

      <ImpactExplorer
        :asset-options="impactAssets"
        :identity-options="impactIdentities"
        initial-mode="identity"
        :initial-entity-id="preselectIdentity"
        :auto-run="true"
      />
    </template>
  </div>
</template>
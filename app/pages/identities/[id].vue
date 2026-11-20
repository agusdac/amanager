<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const id = computed(() => String(route.params.id))

const { data, pending, refresh } = await useFetch(() => `/api/identities/${id.value}`, { watch: [id] })

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

const assetOptions = computed(() =>
  (assetList.value?.assets ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })),
)

useAppPageTitle(
  computed(() =>
    data.value?.identity?.label
      ? `${data.value.identity.label}`
      : t('pageTitles.loading'),
  ),
)

const loginEmails = computed(() =>
  (data.value?.emails ?? []).filter((em: { purpose: string }) => em.purpose === 'login'),
)
const otherEmails = computed(() =>
  (data.value?.emails ?? []).filter((em: { purpose: string }) => em.purpose !== 'login'),
)

const identityTabs = computed(() => [
  { id: 'access', label: t('tabs.identity.access') },
  { id: 'emails', label: t('tabs.identity.emails') },
  {
    id: 'accounts',
    label: t('tabs.identity.accounts'),
    visible: Boolean(data.value?.linkedAccounts?.length),
  },
  { id: 'impact', label: t('tabs.identity.impact') },
])
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

    <p v-if="pending" class="text-muted">{{ t('common.loading') }}</p>

    <AppDetailTabs v-else-if="data" :tabs="identityTabs" default-tab="access">
      <template #access>
        <section class="card space-y-6 p-5">
          <h2 class="sr-only">{{ t('identityDetail.assetsAccess') }}</h2>
          <div class="space-y-3">
          <p class="text-sm font-semibold text-ink">{{ t('identityDetail.assetsAccess') }}</p>
          <p class="lede">{{ t('identityDetail.assetsAccessHint') }}</p>
          <ul v-if="data.assetAccess?.length" class="divide-y divide-rule border-t border-rule-light">
            <li
              v-for="row in data.assetAccess"
              :key="row.roleId"
              class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <NuxtLink :to="`/assets/${row.assetId}`" class="font-medium text-ink hover:underline">
                  {{ row.assetName }}
                </NuxtLink>
                <span class="ml-2 text-subtle">
                  <AssetTypeLabel :type="row.assetType" :provider-slug="row.providerSlug" />
                </span>
                <span class="ml-2 text-subtle">({{ t(`assets.roles.${row.roleType}`) }})</span>
              </div>
              <VerificationChip :status="row.verificationStatus" />
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-subtle">{{ t('identityDetail.noAssets') }}</p>
          <div class="border-t border-rule-light pt-4">
            <p class="text-sm font-medium text-ink">{{ t('identityDetail.linkAsset') }}</p>
            <IdentityAccessForm class="mt-4" :identity-id="id" @linked="refresh()" />
          </div>
          </div>
          <div v-if="assetOptions.length" class="border-t border-rule-light pt-6">
            <p class="text-sm font-medium text-stone-800 dark:text-stone-200">{{ t('identityDetail.openAssetAccess') }}</p>
            <p class="mt-1 text-xs text-subtle">{{ t('identityDetail.openAssetAccessHint') }}</p>
            <ul class="mt-2 flex flex-wrap gap-2 text-sm">
              <li v-for="a in assetOptions" :key="a.id">
                <NuxtLink :to="`/assets/${a.id}?tab=access`" class="rounded-full bg-surface-soft px-3 py-1 text-stone-800 dark:text-stone-200 underline decoration-stone-300">
                  {{ a.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </section>
      </template>

      <template #emails>
        <section class="card space-y-8 p-5">
          <h2 class="sr-only">{{ t('accounts.emails') }}</h2>

          <div class="space-y-3">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="text-sm font-semibold text-ink">{{ t('identityDetail.loginEmailsSection') }}</h3>
              <p class="text-xs text-subtle">{{ t('identityDetail.loginEmailsSectionHint') }}</p>
            </div>
            <ul v-if="loginEmails.length" class="list-card text-sm">
              <li v-for="em in loginEmails" :key="em.address" class="px-3 py-2">
                <span class="font-medium text-ink">{{ em.address }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-subtle">{{ t('identityDetail.noLoginEmails') }}</p>
            <div class="border-t border-rule-light pt-4">
              <p class="text-sm font-medium text-ink">{{ t('assets.linkLoginEmail') }}</p>
              <LoginEmailLinkPanel class="mt-4" mode="identity" :identity-id="id" @linked="refresh()" />
            </div>
          </div>

          <div v-if="otherEmails.length" class="space-y-3 border-t border-rule-light pt-8">
            <h3 class="text-sm font-semibold text-ink">{{ t('identityDetail.otherEmailsSection') }}</h3>
            <ul class="list-card text-sm">
              <li v-for="em in otherEmails" :key="`${em.address}-${em.purpose}`" class="px-3 py-2">
                <span class="font-medium text-ink">{{ em.address }}</span>
                <span class="text-subtle"> · {{ t(`assets.purposes.${em.purpose}`) }}</span>
              </li>
            </ul>
          </div>
        </section>
      </template>

      <template #accounts>
        <section class="card space-y-2 bg-stone-50/80 dark:bg-stone-900/80 dark:bg-stone-900/80 p-5">
          <h2 class="sr-only">{{ t('accounts.providerAccounts') }}</h2>
          <ul class="mt-2 space-y-1 text-sm">
            <li v-for="acc in data.linkedAccounts" :key="acc.accountId">
              {{ acc.label }}
              <span v-if="acc.providerName" class="text-subtle">({{ acc.providerName }})</span>
            </li>
          </ul>
        </section>
      </template>

      <template #impact>
        <ImpactExplorer
          :asset-options="impactAssets"
          :identity-options="impactIdentities"
          initial-mode="identity"
          :initial-entity-id="preselectIdentity"
          :auto-run="true"
        />
      </template>
    </AppDetailTabs>
  </div>
</template>
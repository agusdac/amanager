<script setup lang="ts">
const { t } = useI18n()

useAppPageTitle('pageTitles.accounts')
const { data: identities, refresh: refreshId } = await useFetch('/api/identities')
const { data: emails, refresh: refreshEmail } = await useFetch('/api/email-addresses')
const { data: accounts, refresh: refreshAcc } = await useFetch('/api/provider-accounts')
const { data: providers } = await useFetch('/api/providers')
const { data: assetList } = await useFetch('/api/assets?limit=100')

const idLabel = ref('')
const idProvider = ref('')
const emailAddress = ref('')
const emailLabel = ref('')
const accLabel = ref('')
const accProvider = ref('')
const emailPmUrls = ref<Record<string, string>>({})

watch(
  () => emails.value?.emails,
  (list) => {
    if (!list) return
    const next: Record<string, string> = {}
    for (const em of list) {
      next[em.id] = (em as { passwordManagerItemUrl?: string | null }).passwordManagerItemUrl ?? ''
    }
    emailPmUrls.value = next
  },
  { immediate: true },
)

async function saveEmailPmLink(emailId: string) {
  await $fetch(`/api/email-addresses/${emailId}`, {
    method: 'PATCH',
    body: { passwordManagerItemUrl: emailPmUrls.value[emailId]?.trim() || '' },
  })
  await refreshEmail()
}

const impactAssets = computed(() =>
  (assetList.value?.assets ?? []).map((a: { id: string; name: string }) => ({ id: a.id, label: a.name })),
)
const impactIdentities = computed(() =>
  (identities.value?.identities ?? []).map((i: { id: string; label: string }) => ({
    id: i.id,
    label: i.label,
  })),
)

async function addIdentity() {
  await $fetch('/api/identities', {
    method: 'POST',
    body: { label: idLabel.value, providerId: idProvider.value || null },
  })
  idLabel.value = ''
  await refreshId()
}

async function addEmail() {
  await $fetch('/api/email-addresses', {
    method: 'POST',
    body: {
      address: emailAddress.value,
      label: emailLabel.value.trim() || undefined,
    },
  })
  emailAddress.value = ''
  emailLabel.value = ''
  await refreshEmail()
}

async function addAccount() {
  await $fetch('/api/provider-accounts', {
    method: 'POST',
    body: { label: accLabel.value, providerId: accProvider.value || null },
  })
  accLabel.value = ''
  await refreshAcc()
}

const accountTabs = computed(() => [
  { id: 'emails', label: t('tabs.accounts.emails') },
  { id: 'identities', label: t('tabs.accounts.identities') },
  { id: 'providerAccounts', label: t('tabs.accounts.providerAccounts') },
  { id: 'impact', label: t('tabs.accounts.impact') },
])
</script>

<template>
  <div class="space-y-10">
    <header class="space-y-1">
      <h1 class="page-title">{{ t('accounts.title') }}</h1>
      <p class="lede">{{ t('accounts.subtitle') }}</p>
    </header>

    <AppCallout :title="t('accounts.emailsSpotlightTitle')" variant="info">
      {{ t('accounts.emailsSpotlightBody') }}
    </AppCallout>

    <AppDetailTabs :tabs="accountTabs" default-tab="emails">
      <template #identities>
    <section class="card space-y-4 p-5">
      <h2 class="sr-only">{{ t('accounts.identities') }}</h2>
      <form class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" @submit.prevent="addIdentity">
        <label class="block min-w-[10rem] flex-1 text-sm">
          <span class="label">{{ t('accounts.identityLabel') }}</span>
          <input v-model="idLabel" required class="field mt-1.5" />
        </label>
        <label class="block min-w-[10rem] text-sm">
          <span class="label">{{ t('assets.provider') }}</span>
          <select v-model="idProvider" class="field mt-1.5">
            <option value="">{{ t('accounts.noProvider') }}</option>
            <option v-for="p in providers?.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <button type="submit" class="btn-primary">{{ t('common.add') }}</button>
      </form>
      <ul v-if="identities?.identities?.length" class="divide-y divide-rule border-t border-rule-light">
        <li v-for="item in identities.identities" :key="item.id">
          <NuxtLink
            :to="`/identities/${item.id}`"
            class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm transition-colors hover:bg-surface-muted"
          >
            <div class="flex items-center gap-2">
              <span class="font-medium text-ink">{{ item.label }}</span>
              <span v-if="item.providerName" class="text-subtle">{{ item.providerName }}</span>
              <IconChevronRight class="h-4 w-4 text-faint" />
            </div>
            <VerificationChip :status="item.verificationStatus" />
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="text-sm text-subtle">{{ t('accounts.emptyIdentities') }}</p>
    </section>
      </template>

      <template #emails>
    <section class="card space-y-4 p-5">
      <h2 class="text-sm font-semibold text-ink">{{ t('accounts.emails') }}</h2>
      <p class="text-sm text-muted">{{ t('accounts.emailsHint') }}</p>
      <form class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" @submit.prevent="addEmail">
        <label class="block min-w-[14rem] flex-1 text-sm">
          <span class="label">{{ t('accounts.emailAddress') }}</span>
          <input v-model="emailAddress" type="email" required class="field mt-1.5" />
        </label>
        <label class="block min-w-[12rem] flex-1 text-sm">
          <span class="label">{{ t('accounts.emailLabel') }}</span>
          <input v-model="emailLabel" type="text" class="field mt-1.5" :placeholder="t('accounts.emailLabelPlaceholder')" />
        </label>
        <button type="submit" class="btn-primary">{{ t('common.add') }}</button>
      </form>
      <ul v-if="emails?.emails?.length" class="divide-y divide-rule border-t border-rule-light">
        <li
          v-for="item in emails.emails"
          :key="item.id"
          class="space-y-2 px-4 py-3 text-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="font-medium text-ink">{{ item.address }}</span>
              <p v-if="item.label" class="text-xs text-subtle">{{ item.label }}</p>
            </div>
            <VerificationChip v-if="item.verificationStatus" :status="item.verificationStatus" />
          </div>
          <p v-if="item.identityLinkCount || item.assetLinkCount" class="text-xs text-subtle">
            {{ t('accounts.emailLinkCounts', { identities: item.identityLinkCount ?? 0, assets: item.assetLinkCount ?? 0 }) }}
          </p>
          <PasswordManagerLinkField
            v-model="emailPmUrls[item.id]"
            hint-key="assets.emailPasswordManagerLink"
            @save="saveEmailPmLink(item.id)"
          />
        </li>
      </ul>
      <p v-else class="text-sm text-subtle">{{ t('accounts.emptyEmails') }}</p>
    </section>
      </template>

      <template #providerAccounts>
    <section class="card space-y-4 p-5">
      <h2 class="sr-only">{{ t('accounts.providerAccounts') }}</h2>
      <form class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" @submit.prevent="addAccount">
        <label class="block min-w-[10rem] flex-1 text-sm">
          <span class="label">{{ t('accounts.accountLabel') }}</span>
          <input v-model="accLabel" required class="field mt-1.5" />
        </label>
        <label class="block min-w-[10rem] text-sm">
          <span class="label">{{ t('assets.provider') }}</span>
          <select v-model="accProvider" class="field mt-1.5">
            <option value="">{{ t('accounts.noProvider') }}</option>
            <option v-for="p in providers?.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <button type="submit" class="btn-primary">{{ t('common.add') }}</button>
      </form>
      <ul v-if="accounts?.accounts?.length" class="divide-y divide-rule border-t border-rule-light">
        <li
          v-for="item in accounts.accounts"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
        >
          <span>
            <span class="font-medium text-ink">{{ item.label }}</span>
            <span v-if="item.providerName" class="ml-2 text-subtle">({{ item.providerName }})</span>
          </span>
          <VerificationChip :status="item.verificationStatus" />
        </li>
      </ul>
      <p v-else class="text-sm text-subtle">{{ t('accounts.emptyAccounts') }}</p>
    </section>
      </template>

      <template #impact>
    <ImpactExplorer :asset-options="impactAssets" :identity-options="impactIdentities" />
      </template>
    </AppDetailTabs>
  </div>
</template>
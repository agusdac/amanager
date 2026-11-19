<script setup lang="ts">
const { t } = useI18n()
const { data: identities, refresh: refreshId } = await useFetch('/api/identities')
const { data: emails, refresh: refreshEmail } = await useFetch('/api/email-addresses')
const { data: accounts, refresh: refreshAcc } = await useFetch('/api/provider-accounts')
const { data: providers } = await useFetch('/api/providers')

const idLabel = ref('')
const idProvider = ref('')
const emailAddress = ref('')
const accLabel = ref('')
const accProvider = ref('')

async function addIdentity() {
  await $fetch('/api/identities', {
    method: 'POST',
    body: { label: idLabel.value, providerId: idProvider.value || null },
  })
  idLabel.value = ''
  await refreshId()
}

async function addEmail() {
  await $fetch('/api/email-addresses', { method: 'POST', body: { address: emailAddress.value } })
  emailAddress.value = ''
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
</script>

<template>
  <div class="space-y-10">
    <h1 class="text-2xl font-semibold">{{ t('accounts.title') }}</h1>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">{{ t('accounts.identities') }}</h2>
      <form class="flex flex-wrap gap-2" @submit.prevent="addIdentity">
        <input v-model="idLabel" required :placeholder="t('accounts.identityLabel')" class="rounded border px-3 py-2 text-sm" />
        <select v-model="idProvider" class="rounded border px-3 py-2 text-sm">
          <option value="">{{ t('accounts.noProvider') }}</option>
          <option v-for="p in providers?.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button type="submit" class="rounded bg-stone-900 px-3 py-2 text-sm text-white">{{ t('common.add') }}</button>
      </form>
      <ul class="divide-y rounded-lg border bg-white">
        <li v-for="item in identities?.identities" :key="item.id" class="px-4 py-2 text-sm">
          <span class="font-medium">{{ item.label }}</span>
          <span class="ml-2 text-stone-500">{{ item.providerName }}</span>
          <span class="ml-2 rounded bg-stone-100 px-1.5 text-xs">{{ item.verificationStatus }}</span>
        </li>
      </ul>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">{{ t('accounts.emails') }}</h2>
      <form class="flex gap-2" @submit.prevent="addEmail">
        <input v-model="emailAddress" type="email" required class="rounded border px-3 py-2 text-sm" />
        <button type="submit" class="rounded bg-stone-900 px-3 py-2 text-sm text-white">{{ t('common.add') }}</button>
      </form>
      <ul class="divide-y rounded-lg border bg-white">
        <li v-for="item in emails?.emails" :key="item.id" class="px-4 py-2 text-sm">{{ item.address }}</li>
      </ul>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">{{ t('accounts.providerAccounts') }}</h2>
      <form class="flex flex-wrap gap-2" @submit.prevent="addAccount">
        <input v-model="accLabel" required class="rounded border px-3 py-2 text-sm" />
        <select v-model="accProvider" class="rounded border px-3 py-2 text-sm">
          <option value="">{{ t('accounts.noProvider') }}</option>
          <option v-for="p in providers?.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button type="submit" class="rounded bg-stone-900 px-3 py-2 text-sm text-white">{{ t('common.add') }}</button>
      </form>
      <ul class="divide-y rounded-lg border bg-white">
        <li v-for="item in accounts?.accounts" :key="item.id" class="px-4 py-2 text-sm">
          {{ item.label }} <span class="text-stone-500">({{ item.providerName }})</span>
        </li>
      </ul>
    </section>
  </div>
</template>
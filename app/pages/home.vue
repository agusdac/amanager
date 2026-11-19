<script setup lang="ts">
const { t } = useI18n()
const { data } = await useFetch('/api/dashboard')
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">{{ t('home.title') }}</h1>
      <p class="text-sm text-stone-600">{{ t('app.tagline') }}</p>
    </div>

    <div v-if="data" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-stone-200 bg-white p-4">
        <p class="text-xs uppercase text-stone-500">{{ t('home.projects') }}</p>
        <p class="mt-1 text-2xl font-semibold">{{ data.counts.projects }}</p>
      </div>
      <div class="rounded-lg border border-stone-200 bg-white p-4">
        <p class="text-xs uppercase text-stone-500">{{ t('home.assets') }}</p>
        <p class="mt-1 text-2xl font-semibold">{{ data.counts.assets }}</p>
      </div>
      <div class="rounded-lg border border-stone-200 bg-white p-4">
        <p class="text-xs uppercase text-stone-500">{{ t('home.identities') }}</p>
        <p class="mt-1 text-2xl font-semibold">{{ data.counts.identities }}</p>
      </div>
      <div class="rounded-lg border border-stone-200 bg-white p-4">
        <p class="text-xs uppercase text-stone-500">{{ t('home.dependencies') }}</p>
        <p class="mt-1 text-2xl font-semibold">{{ data.counts.dependencies }}</p>
      </div>
    </div>

    <div v-if="data?.onboarding" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
      {{ t('home.resumeOnboarding', { step: data.onboarding.step }) }}
      <NuxtLink to="/onboarding" class="ml-2 font-medium underline">{{ t('home.continue') }}</NuxtLink>
    </div>

    <div class="flex flex-wrap gap-3">
      <NuxtLink to="/onboarding" class="rounded bg-stone-900 px-4 py-2 text-sm text-white">{{ t('nav.onboarding') }}</NuxtLink>
      <NuxtLink to="/import" class="rounded border border-stone-300 px-4 py-2 text-sm">{{ t('nav.import') }}</NuxtLink>
    </div>
  </div>
</template>
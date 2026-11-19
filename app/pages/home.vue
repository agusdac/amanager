<script setup lang="ts">
const { t } = useI18n()
useAppPageTitle('pageTitles.home')
const { data } = await useFetch('/api/dashboard')
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="page-title">{{ t('home.title') }}</h1>
      <p class="lede">{{ t('app.tagline') }}</p>
    </div>

    <section class="card p-5">
      <WorkspaceSearch />
    </section>

    <div v-if="data" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink to="/projects" class="card p-4 transition-shadow hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.projects') }}</p>
        <p class="stat-value">{{ data.counts.projects }}</p>
      </NuxtLink>
      <NuxtLink to="/assets" class="card p-4 transition-shadow hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.assets') }}</p>
        <p class="stat-value">{{ data.counts.assets }}</p>
      </NuxtLink>
      <NuxtLink to="/accounts" class="card p-4 transition-shadow hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.identities') }}</p>
        <p class="stat-value">{{ data.counts.identities }}</p>
      </NuxtLink>
      <NuxtLink to="/assets" class="card p-4 transition-shadow hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.dependencies') }}</p>
        <p class="stat-value">{{ data.counts.dependencies }}</p>
      </NuxtLink>
    </div>

    <section
      v-if="data?.counts?.unverifiedAssets"
      class="rounded-xl border border-amber-200 bg-amber-50/80 p-5"
    >
      <h2 class="text-sm font-medium text-amber-950">{{ t('home.attentionTitle') }}</h2>
      <p class="mt-1 text-sm text-amber-900/90">
        {{ t('home.attentionHint', { count: data.counts.unverifiedAssets }) }}
      </p>
      <ul v-if="data.attentionAssets?.length" class="mt-3 space-y-2 text-sm">
        <li v-for="a in data.attentionAssets" :key="a.id">
          <NuxtLink :to="`/assets/${a.id}`" class="font-medium text-amber-950 underline">
            {{ a.name }}
          </NuxtLink>
          <span class="ml-2 text-amber-800/80"><AssetTypeLabel :type="a.type" :show-icon="false" /></span>
        </li>
      </ul>
    </section>

    <div v-if="data?.onboarding" class="notice">
      {{ t('home.resumeOnboarding', { step: data.onboarding.step }) }}
      <NuxtLink to="/onboarding" class="ml-2 font-medium text-stone-900 underline">{{ t('home.continue') }}</NuxtLink>
    </div>

    <div class="flex flex-wrap gap-3">
      <NuxtLink to="/checklist" class="btn-primary">{{ t('home.openChecklist') }}</NuxtLink>
      <NuxtLink to="/onboarding" class="btn-secondary">{{ t('nav.onboarding') }}</NuxtLink>
      <NuxtLink to="/import" class="btn-secondary">{{ t('nav.import') }}</NuxtLink>
    </div>
  </div>
</template>
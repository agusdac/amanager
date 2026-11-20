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

    <AppCallout :title="t('home.emailsSpotlightTitle')" variant="info">
      {{ t('home.emailsSpotlightBody') }}
      <template #actions>
        <NuxtLink to="/accounts?tab=emails" class="btn-primary text-sm">{{ t('home.manageEmails') }}</NuxtLink>
        <NuxtLink to="/accounts?tab=impact" class="btn-secondary text-sm">{{ t('home.emailImpact') }}</NuxtLink>
      </template>
    </AppCallout>

    <div v-if="data" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <NuxtLink to="/accounts?tab=emails" class="card p-4 transition-shadow hover:shadow-md ring-1 ring-stone-900/5">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.emails') }}</p>
        <p class="stat-value">{{ data.counts.emails }}</p>
      </NuxtLink>
      <NuxtLink to="/projects" class="card p-4 transition-shadow hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.projects') }}</p>
        <p class="stat-value">{{ data.counts.projects }}</p>
      </NuxtLink>
      <NuxtLink to="/accounts?tab=identities" class="card p-4 transition-shadow hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.identities') }}</p>
        <p class="stat-value">{{ data.counts.identities }}</p>
      </NuxtLink>
      <NuxtLink to="/assets" class="card p-4 transition-shadow hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.assets') }}</p>
        <p class="stat-value">{{ data.counts.assets }}</p>
      </NuxtLink>
      <NuxtLink to="/assets" class="card p-4 transition-shadow hover:shadow-md">
        <p class="text-xs uppercase tracking-wide text-stone-500">{{ t('home.dependencies') }}</p>
        <p class="stat-value">{{ data.counts.dependencies }}</p>
      </NuxtLink>
    </div>

    <AppCallout
      v-if="data?.counts?.unverifiedAssets"
      :title="t('home.attentionTitle')"
      variant="warning"
    >
      {{ t('home.attentionHint', { count: data.counts.unverifiedAssets }) }}
      <ul v-if="data.attentionAssets?.length" class="mt-3 space-y-2 text-sm text-stone-700">
        <li v-for="a in data.attentionAssets" :key="a.id" class="flex flex-wrap items-center gap-2">
          <NuxtLink
            :to="`/assets/${a.id}?tab=verifications`"
            class="font-medium text-stone-900 underline"
          >
            {{ a.name }}
          </NuxtLink>
          <AssetTypeLabel :type="a.type" :show-icon="false" />
          <VerificationChip :status="a.verificationStatus" />
        </li>
      </ul>
      <p
        v-if="data.counts.unverifiedAssets > (data.attentionAssets?.length ?? 0)"
        class="mt-2 text-xs text-stone-500"
      >
        {{ t('home.attentionMore', { count: data.counts.unverifiedAssets - (data.attentionAssets?.length ?? 0) }) }}
      </p>
      <template #actions>
        <NuxtLink to="/assets?verification=needs_confirmation" class="btn-primary text-sm">
          {{ t('home.reviewVerificationQueue') }}
        </NuxtLink>
        <NuxtLink to="/checklist" class="btn-secondary text-sm">
          {{ t('home.openChecklist') }}
        </NuxtLink>
      </template>
    </AppCallout>

    <div v-if="data?.onboarding" class="notice">
      {{ t('home.resumeOnboarding', { step: data.onboarding.step }) }}
      <NuxtLink to="/onboarding" class="ml-2 font-medium text-stone-900 underline">{{ t('home.continue') }}</NuxtLink>
    </div>

    <div class="flex flex-wrap gap-3">
      <NuxtLink to="/accounts?tab=emails" class="btn-primary">{{ t('home.manageEmails') }}</NuxtLink>
      <NuxtLink to="/checklist" class="btn-secondary">{{ t('home.openChecklist') }}</NuxtLink>
      <NuxtLink to="/onboarding" class="btn-secondary">{{ t('nav.onboarding') }}</NuxtLink>
      <NuxtLink to="/import" class="btn-secondary">{{ t('nav.import') }}</NuxtLink>
    </div>
  </div>
</template>
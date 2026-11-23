<script setup lang="ts">
const { t } = useI18n()
useAppPageTitle('pageTitles.home')

const { projectId } = useWorkspaceScope()
const { pathWithScope } = useScopedNavigation()

const { data, pending, error: fetchError } = await useFetch('/api/dashboard', {
  query: computed(() => (projectId.value ? { projectId: projectId.value } : {})),
  watch: [projectId],
})
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-2">
      <h1 class="page-title">{{ t('home.title') }}</h1>
      <p class="lede">{{ t('app.tagline') }}</p>
      <ProjectScopeBanner />
    </header>

    <section class="card p-5">
      <WorkspaceSearch />
    </section>

    <section class="card p-5" aria-labelledby="home-favorites-heading">
      <FavoritesQuickAccess variant="home" :max-items="12" />
    </section>

    <div v-if="data?.onboarding" class="notice">
      {{ t('home.resumeOnboarding', { step: data.onboarding.step }) }}
      <NuxtLink to="/onboarding" class="ml-2 font-medium text-ink underline">{{ t('home.continue') }}</NuxtLink>
    </div>

    <p v-if="fetchError" class="text-sm text-red-700" role="alert">
      {{ t('common.errorGeneric') }}
    </p>

    <AppCallout
      v-if="data?.counts?.unverifiedAssets"
      :title="t('home.attentionTitle')"
      variant="warning"
    >
      {{ t('home.attentionHint', { count: data.counts.unverifiedAssets }) }}
      <ul v-if="data.attentionAssets?.length" class="mt-3 space-y-2 text-sm text-ink-secondary">
        <li v-for="a in data.attentionAssets" :key="a.id" class="flex flex-wrap items-center gap-2">
          <NuxtLink
            :to="`/assets/${a.id}?tab=verifications`"
            class="font-medium text-ink underline"
          >
            {{ a.name }}
          </NuxtLink>
          <AssetTypeLabel :type="a.type" :show-icon="false" />
          <VerificationChip :status="a.verificationStatus" />
        </li>
      </ul>
      <p
        v-if="data.counts.unverifiedAssets > (data.attentionAssets?.length ?? 0)"
        class="mt-2 text-xs text-subtle"
      >
        {{ t('home.attentionMore', { count: data.counts.unverifiedAssets - (data.attentionAssets?.length ?? 0) }) }}
      </p>
      <template #actions>
        <NuxtLink :to="pathWithScope('/assets?verification=needs_confirmation')" class="btn-primary text-sm">
          {{ t('home.reviewVerificationQueue') }}
        </NuxtLink>
        <NuxtLink to="/checklist" class="btn-secondary text-sm">
          {{ t('home.openChecklist') }}
        </NuxtLink>
      </template>
    </AppCallout>

    <section aria-labelledby="home-stats-heading">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="home-stats-heading" class="text-base font-semibold text-ink">
          {{ t('home.statsTitle') }}
        </h2>
        <NuxtLink :to="pathWithScope('/import')" class="text-sm text-muted underline hover:text-ink">
          {{ t('nav.import') }}
        </NuxtLink>
      </div>

      <div
        v-if="pending"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        :aria-label="t('pageTitles.loading')"
      >
        <div v-for="n in 6" :key="n" class="card p-4">
          <div class="h-3 w-16 animate-pulse rounded bg-stone-200" />
          <div class="mt-3 h-7 w-10 animate-pulse rounded bg-stone-200" />
        </div>
      </div>

      <div v-else-if="data" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink :to="pathWithScope('/accounts?tab=emails')" class="card p-4 hover:bg-stone-50 dark:hover:bg-stone-800/80 dark:bg-stone-900/80">
          <p class="text-xs uppercase tracking-wide text-subtle">{{ t('home.emails') }}</p>
          <p class="stat-value">{{ data.counts.emails }}</p>
        </NuxtLink>
        <NuxtLink :to="pathWithScope('/projects')" class="card p-4 hover:bg-stone-50 dark:hover:bg-stone-800/80 dark:bg-stone-900/80">
          <p class="text-xs uppercase tracking-wide text-subtle">{{ t('home.projects') }}</p>
          <p class="stat-value">{{ data.counts.projects }}</p>
        </NuxtLink>
        <NuxtLink :to="pathWithScope('/accounts?tab=identities')" class="card p-4 hover:bg-stone-50 dark:hover:bg-stone-800/80 dark:bg-stone-900/80">
          <p class="text-xs uppercase tracking-wide text-subtle">{{ t('home.identities') }}</p>
          <p class="stat-value">{{ data.counts.identities }}</p>
        </NuxtLink>
        <NuxtLink :to="pathWithScope('/assets')" class="card p-4 hover:bg-stone-50 dark:hover:bg-stone-800/80 dark:bg-stone-900/80">
          <p class="text-xs uppercase tracking-wide text-subtle">{{ t('home.assets') }}</p>
          <p class="stat-value">{{ data.counts.assets }}</p>
        </NuxtLink>
        <NuxtLink :to="pathWithScope('/assets')" class="card p-4 hover:bg-stone-50 dark:hover:bg-stone-800/80 dark:bg-stone-900/80">
          <p class="text-xs uppercase tracking-wide text-subtle">{{ t('home.dependencies') }}</p>
          <p class="stat-value">{{ data.counts.dependencies }}</p>
        </NuxtLink>
        <NuxtLink :to="pathWithScope('/guides')" class="card p-4 hover:bg-stone-50 dark:hover:bg-stone-800/80 dark:bg-stone-900/80">
          <p class="text-xs uppercase tracking-wide text-subtle">{{ t('nav.guides') }}</p>
          <p class="stat-value">{{ data.counts.runbooks ?? 0 }}</p>
        </NuxtLink>
      </div>
    </section>

    <AppCallout :title="t('home.emailsSpotlightTitle')" variant="info">
      {{ t('home.emailsSpotlightBody') }}
      <template #actions>
        <NuxtLink to="/accounts?tab=emails" class="btn-primary text-sm">{{ t('home.manageEmails') }}</NuxtLink>
        <NuxtLink to="/accounts?tab=impact" class="btn-secondary text-sm">{{ t('home.emailImpact') }}</NuxtLink>
      </template>
    </AppCallout>

    <AppCallout :title="t('home.guidesCardTitle')" variant="info">
      {{ t('home.guidesCardBody') }}
      <template #actions>
        <NuxtLink to="/guides/new" class="btn-primary text-sm">{{ t('guides.newFromTemplate') }}</NuxtLink>
        <NuxtLink to="/guides" class="btn-secondary text-sm">{{ t('nav.guides') }}</NuxtLink>
        <NuxtLink to="/guides/templates/workspace" class="btn-secondary text-sm">
          {{ t('guides.templates.createWorkspace') }}
        </NuxtLink>
      </template>
      <p v-if="data?.counts?.activeExecutions" class="mt-2 text-sm text-ink-secondary">
        {{ t('home.guidesInProgress', { count: data.counts.activeExecutions }) }}
      </p>
    </AppCallout>
  </div>
</template>
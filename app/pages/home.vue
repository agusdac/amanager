<script setup lang="ts">
const { t } = useI18n()
useAppPageTitle('pageTitles.home')

const { projectId } = useWorkspaceScope()
const { pathWithScope } = useScopedNavigation()

const { data, pending, error: fetchError } = await useFetch('/api/dashboard', {
  query: computed(() => (projectId.value ? { projectId: projectId.value } : {})),
  watch: [projectId],
})

const guideNowHref = computed(() => {
  const sole = data.value?.soleActiveExecution
  if (data.value?.counts?.activeExecutions === 1 && sole) {
    return `/guides/${sole.runbookId}/execute/${sole.executionId}`
  }
  return pathWithScope('/guides')
})

const showNow = computed(() => {
  const d = data.value
  if (!d) return false
  return Boolean(
    d.onboarding ||
      (d.counts?.unverifiedAssets ?? 0) > 0 ||
      (d.counts?.activeExecutions ?? 0) > 0 ||
      (d.counts?.emailAssetLinks ?? 0) > 0,
  )
})

const inventoryRows = computed(() => {
  const c = data.value?.counts
  if (!c) return []
  return [
    { to: pathWithScope('/accounts?tab=emails'), label: t('home.emails'), count: c.emails },
    { to: pathWithScope('/projects'), label: t('home.projects'), count: c.projects },
    { to: pathWithScope('/accounts?tab=identities'), label: t('home.identities'), count: c.identities },
    { to: pathWithScope('/assets'), label: t('home.assets'), count: c.assets },
    { to: pathWithScope('/assets'), label: t('home.dependencies'), count: c.dependencies },
    { to: pathWithScope('/guides'), label: t('nav.guides'), count: c.runbooks ?? 0 },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0 space-y-1">
        <h1 class="page-title">{{ t('home.title') }}</h1>
        <ProjectScopeBanner />
      </div>
      <NuxtLink :to="pathWithScope('/import')" class="btn-secondary shrink-0 text-sm">
        {{ t('nav.import') }}
      </NuxtLink>
    </header>

    <p v-if="fetchError" class="error-text" role="alert">
      {{ t('common.errorGeneric') }}
    </p>

    <ul v-if="showNow" class="list-card" :aria-label="t('home.nowTitle')">
      <li v-if="data?.onboarding">
        <NuxtLink to="/onboarding" class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-muted">
          <span class="min-w-0 flex-1 text-sm text-ink">{{ t('home.resumeOnboarding', { step: data.onboarding.step }) }}</span>
          <IconChevronRight class="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        </NuxtLink>
      </li>
      <li v-if="data?.counts?.unverifiedAssets">
        <NuxtLink
          :to="pathWithScope('/assets?verification=needs_confirmation')"
          class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-muted"
        >
          <span class="min-w-0 flex-1 text-sm text-ink">
            {{ t('home.nowVerification', { count: data.counts.unverifiedAssets }) }}
          </span>
          <IconChevronRight class="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        </NuxtLink>
      </li>
      <li v-if="data?.counts?.activeExecutions">
        <NuxtLink :to="guideNowHref" class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-muted">
          <span class="min-w-0 flex-1 text-sm text-ink">
            {{
              data.counts.activeExecutions === 1
                ? t('home.nowGuideExecutionOne')
                : t('home.nowGuideExecutionMany', { count: data.counts.activeExecutions })
            }}
          </span>
          <IconChevronRight class="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        </NuxtLink>
      </li>
      <li v-if="data?.counts?.emailAssetLinks">
        <NuxtLink
          :to="pathWithScope('/accounts?tab=impact')"
          class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-muted"
        >
          <span class="min-w-0 flex-1 text-sm text-ink">
            {{ t('home.nowEmailImpact', { links: data.counts.emailAssetLinks, emails: data.counts.emails }) }}
          </span>
          <IconChevronRight class="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>

    <p v-else-if="data && !pending" class="text-sm text-muted">
      {{ t('home.allClear') }}
    </p>

    <ul
      v-if="pending"
      class="list-card"
      aria-busy="true"
      :aria-label="t('pageTitles.loading')"
    >
      <li v-for="n in 6" :key="n">
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <div class="h-4 w-32 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          <div class="h-4 w-8 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
        </div>
      </li>
    </ul>

    <ul v-else-if="data" class="list-card" :aria-label="t('home.statsTitle')">
      <li v-for="row in inventoryRows" :key="row.label">
        <NuxtLink :to="row.to" class="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-muted">
          <span class="min-w-0 flex-1 font-medium text-ink">{{ row.label }}</span>
          <span class="tabular-nums text-sm text-muted">{{ row.count }}</span>
          <IconChevronRight class="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
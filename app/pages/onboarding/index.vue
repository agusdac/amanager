<script setup lang="ts">
import { onboardingDefaultForProvider, suggestOnboardingDependencies } from '~/constants/onboardingDefaults'
import { compareOnboardingProviderCategories } from '~/constants/onboardingProviderLayout'

import { ONBOARDING_MAX_STEP } from '~/constants/onboarding'
import type {
  OnboardingResourceDraft,
  PriorIdentityOption,
} from '~/components/onboarding/OnboardingResourceStep.vue'

const TOTAL_STEPS = ONBOARDING_MAX_STEP

type ProviderRow = {
  slug: string
  name: string
  category: string | null
}

type DependencyDraft = {
  fromProviderSlug: string
  toProviderSlug: string
  relationType: string
  enabled: boolean
}

const { t } = useI18n()
useAppPageTitle('pageTitles.onboarding')
const step = ref(1)
const stepError = ref('')
const finalizeError = ref('')
const saving = ref(false)
const finishing = ref(false)
const lastSaved = ref(false)

const { data: draftData, refresh } = await useFetch('/api/onboarding', { key: 'onboarding-draft' })

const draftHydrated = ref(false)
const { data: providers } = await useFetch('/api/providers')

const projectName = ref('')
const websiteHost = ref('')
const websiteDomainUnverified = ref(false)
const description = ref('')
const selectedProviders = ref<string[]>([])
const providerSearch = ref('')
const resourceDrafts = ref<OnboardingResourceDraft[]>([])
const dependencyDrafts = ref<DependencyDraft[]>([])
const resourceCursor = ref(0)

const stepNavLabels = computed(() => [
  t('onboarding.navWelcome'),
  t('onboarding.navProject'),
  t('onboarding.navTools'),
  t('onboarding.navAssets'),
  t('onboarding.navConnections'),
  t('onboarding.navReview'),
])

const activeResourceDrafts = computed(() => resourceDrafts.value.filter((r) => r.enabled))

const continueLabel = computed(() => {
  if (step.value === 4 && resourceCursor.value < resourceDrafts.value.length - 1) {
    return t('onboarding.assetAccessNextResource')
  }
  return t('onboarding.continue')
})

const resourceStepperLabels = computed(() =>
  resourceDrafts.value.map((r) => {
    if (r.name.trim()) return r.name.trim()
    if (r.providerSlug) return providerDisplayName(r.providerSlug)
    return t('onboarding.customResource')
  }),
)

async function goToResourceIndex(index: number) {
  if (index < 0 || index >= resourceDrafts.value.length || index === resourceCursor.value) return
  resourceCursor.value = index
  await saveDraft()
}

const providerList = computed(() => (providers.value?.providers ?? []) as ProviderRow[])

const providerBySlug = computed(() => {
  const map = new Map<string, ProviderRow>()
  for (const p of providerList.value) map.set(p.slug, p)
  return map
})

const groupedProviders = computed(() => {
  const q = providerSearch.value.trim().toLowerCase()
  const filtered = providerList.value.filter((p) => {
    if (!q) return true
    return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
  })
  const groups = new Map<string, ProviderRow[]>()
  for (const p of filtered) {
    const cat = p.category ?? 'other'
    const list = groups.get(cat) ?? []
    list.push(p)
    groups.set(cat, list)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => compareOnboardingProviderCategories(a, b))
    .map(([category, items]) => [
      category,
      [...items].sort((a, b) => a.name.localeCompare(b.name)),
    ] as const)
})

function categoryLabel(category: string) {
  const key = `onboarding.categories.${category}` as const
  const translated = t(key)
  return translated !== key ? translated : category
}

function providerDisplayName(slug: string) {
  return providerBySlug.value.get(slug)?.name ?? slug
}

function identityRefFor(r: OnboardingResourceDraft) {
  return `${r.identityLabel.trim()}\0${r.providerSlug}`
}

function defaultResourceForProvider(slug: string): OnboardingResourceDraft {
  const defaults = onboardingDefaultForProvider(slug)
  return {
    key: slug,
    providerSlug: slug,
    name: t(defaults.assetNameKey),
    type: defaults.assetType,
    enabled: true,
    identitySource: 'new',
    identityRef: '',
    identityLabel: defaultIdentityLabel(slug),
    loginEmail: '',
    roleType: 'admin',
    verificationStatus: 'declared',
    linkLoginEmail: false,
  }
}

function newCustomResource(): OnboardingResourceDraft {
  return {
    key: `custom-${crypto.randomUUID()}`,
    providerSlug: '',
    name: '',
    type: 'other',
    enabled: true,
    identitySource: 'new',
    identityRef: '',
    identityLabel: '',
    loginEmail: '',
    roleType: 'admin',
    verificationStatus: 'declared',
    linkLoginEmail: false,
  }
}

function migrateLegacyResourcePayload(p: Record<string, unknown>): OnboardingResourceDraft[] | null {
  if (Array.isArray(p.resourceDrafts)) return p.resourceDrafts as OnboardingResourceDraft[]
  const assets = Array.isArray(p.assetDrafts) ? (p.assetDrafts as Record<string, unknown>[]) : []
  const setups = Array.isArray(p.assetSetupDrafts) ? (p.assetSetupDrafts as Record<string, unknown>[]) : []
  const identities = Array.isArray(p.identityDrafts) ? (p.identityDrafts as Record<string, unknown>[]) : []
  if (!assets.length && !setups.length) return null
  return assets.map((a) => {
    const slug = String(a.providerSlug ?? '')
    const setup = setups.find((s) => s.providerSlug === slug)
    const id = identities.find((i) => i.providerSlug === slug && !i.unsure)
    return {
      key: slug || `custom-${crypto.randomUUID()}`,
      providerSlug: slug,
      name: String(a.name ?? ''),
      type: String(a.type ?? 'service'),
      enabled: a.enabled !== false,
      identitySource: 'new' as const,
      identityRef: '',
      identityLabel: String(id?.label ?? setup?.identityLabel ?? ''),
      loginEmail: String(id?.loginEmail ?? ''),
      roleType: (setup?.roleType as OnboardingResourceDraft['roleType']) ?? 'admin',
      verificationStatus:
        (setup?.verificationStatus as OnboardingResourceDraft['verificationStatus']) ?? 'declared',
      linkLoginEmail: Boolean(setup?.linkLoginEmail),
    }
  })
}

function applyDraftFromServer() {
  if (draftHydrated.value) return
  const draft = draftData.value?.draft
  if (!draft) return
  draftHydrated.value = true

  step.value = Math.min(Math.max(draft.step, 1), TOTAL_STEPS)
  const p = draft.payload as Record<string, unknown>
  if (typeof p.projectName === 'string') projectName.value = p.projectName
  if (typeof p.websiteUrl === 'string') {
    const raw = p.websiteUrl as string
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      websiteHost.value = raw.replace(/^https?:\/\//, '')
      websiteDomainUnverified.value = false
    } else {
      websiteHost.value = raw
      websiteDomainUnverified.value = true
    }
  }
  if (typeof p.websiteDomainUnverified === 'boolean') websiteDomainUnverified.value = p.websiteDomainUnverified
  if (typeof p.description === 'string') description.value = p.description
  if (Array.isArray(p.selectedProviders)) {
    selectedProviders.value = p.selectedProviders.map(String)
  }
  const migrated = migrateLegacyResourcePayload(p)
  if (migrated) resourceDrafts.value = migrated
  if (Array.isArray(p.dependencyDrafts)) dependencyDrafts.value = p.dependencyDrafts as DependencyDraft[]
  if (typeof p.resourceCursor === 'number') {
    resourceCursor.value = Math.max(0, p.resourceCursor)
  } else if (typeof p.assetSetupCursor === 'number') {
    resourceCursor.value = Math.max(0, p.assetSetupCursor)
  }
}

watch(
  () => draftData.value?.draft,
  () => applyDraftFromServer(),
  { immediate: true },
)

let autosaveTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => ({
    step: step.value,
    projectName: projectName.value,
    websiteHost: websiteHost.value,
    websiteDomainUnverified: websiteDomainUnverified.value,
    description: description.value,
    selectedProviders: selectedProviders.value,
    resourceDrafts: resourceDrafts.value,
    dependencyDrafts: dependencyDrafts.value,
    resourceCursor: resourceCursor.value,
  }),
  () => {
    if (step.value < 2) return
    if (saving.value || finishing.value) return
    clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => void saveDraft(), 900)
  },
  { deep: true },
)

onBeforeUnmount(() => clearTimeout(autosaveTimer))

function resolvedWebsiteUrl(): string {
  const host = websiteHost.value.trim().replace(/^https?:\/\//, '')
  if (!host) return ''
  if (websiteDomainUnverified.value) return host
  return `https://${host}`
}

function defaultIdentityLabel(slug: string) {
  const defaults = onboardingDefaultForProvider(slug)
  return t(defaults.identityLabelKey, { project: projectName.value.trim() || t('onboarding.sampleProject') })
}

function roleHintKey(slug: string) {
  return onboardingDefaultForProvider(slug).roleHintKey
}

function syncResourceDraftsFromProviders() {
  const customs = resourceDrafts.value.filter((r) => r.key.startsWith('custom-'))
  const byKey = new Map(resourceDrafts.value.map((r) => [r.key, r]))
  const fromProviders = selectedProviders.value.map(
    (slug) => byKey.get(slug) ?? defaultResourceForProvider(slug),
  )
  resourceDrafts.value = [...fromProviders, ...customs]
  if (!resourceDrafts.value.length) {
    resourceDrafts.value.push(newCustomResource())
  }
  if (resourceCursor.value >= resourceDrafts.value.length) {
    resourceCursor.value = Math.max(0, resourceDrafts.value.length - 1)
  }
}

function patchResource(key: string, patch: Partial<OnboardingResourceDraft>) {
  const idx = resourceDrafts.value.findIndex((r) => r.key === key)
  if (idx < 0) return
  resourceDrafts.value[idx] = { ...resourceDrafts.value[idx], ...patch }
}

function priorIdentitiesForIndex(index: number): PriorIdentityOption[] {
  const seen = new Map<string, PriorIdentityOption>()
  for (let i = 0; i < index; i++) {
    const r = resourceDrafts.value[i]
    if (!r?.enabled || !r.identityLabel.trim()) continue
    const ref = identityRefFor(r)
    seen.set(ref, {
      ref,
      label: r.identityLabel.trim(),
      providerSlug: r.providerSlug,
      loginEmail: r.loginEmail,
      fromResourceName: r.name.trim() || providerDisplayName(r.providerSlug),
    })
  }
  return [...seen.values()]
}

function copyPreviousResource() {
  const cur = resourceCursor.value
  if (cur < 1) return
  const prev = resourceDrafts.value[cur - 1]
  const row = resourceDrafts.value[cur]
  if (!prev || !row) return
  patchResource(row.key, {
    identitySource: prev.identitySource,
    identityRef: prev.identityRef,
    identityLabel: prev.identityLabel,
    loginEmail: prev.loginEmail,
    roleType: prev.roleType,
    verificationStatus: prev.verificationStatus,
    linkLoginEmail: prev.linkLoginEmail,
  })
}

function applyVerifyDeclaredToRemaining() {
  for (let i = resourceCursor.value; i < resourceDrafts.value.length; i++) {
    resourceDrafts.value[i] = { ...resourceDrafts.value[i], verificationStatus: 'declared' }
  }
}

function applyVerifyConfirmedToRemaining() {
  for (let i = resourceCursor.value; i < resourceDrafts.value.length; i++) {
    resourceDrafts.value[i] = { ...resourceDrafts.value[i], verificationStatus: 'confirmed_by_human' }
  }
}

function addCustomResource() {
  resourceDrafts.value.push(newCustomResource())
}

function removeCurrentCustomResource() {
  const row = resourceDrafts.value[resourceCursor.value]
  if (!row?.key.startsWith('custom-')) return
  resourceDrafts.value.splice(resourceCursor.value, 1)
  if (!resourceDrafts.value.length) resourceDrafts.value.push(newCustomResource())
  resourceCursor.value = Math.min(resourceCursor.value, resourceDrafts.value.length - 1)
}

function buildFinalizeBundles() {
  const enabled = resourceDrafts.value.filter((r) => r.enabled && r.name.trim())
  const identitySeen = new Set<string>()
  const identities: { label: string; providerSlug: string; unsure: boolean; loginEmail: string }[] = []
  for (const r of enabled) {
    if (!r.identityLabel.trim()) continue
    const ref = identityRefFor(r)
    if (identitySeen.has(ref)) continue
    identitySeen.add(ref)
    identities.push({
      label: r.identityLabel.trim(),
      providerSlug: r.providerSlug,
      unsure: false,
      loginEmail: r.loginEmail.trim(),
    })
  }
  const assets = enabled.map((r) => ({
    draftKey: r.key,
    name: r.name.trim(),
    type: r.type,
    providerSlug: r.providerSlug || null,
    unsure: false,
  }))
  const assetSetups = enabled
    .filter((r) => r.identityLabel.trim())
    .map((r) => ({
      draftKey: r.key,
      providerSlug: r.providerSlug || undefined,
      identityLabel: r.identityLabel.trim(),
      roleType: r.roleType,
      verificationStatus: r.verificationStatus,
      linkLoginEmail: r.linkLoginEmail,
    }))
  return { identities, assets, assetSetups }
}

function syncDependencyDrafts() {
  const suggestions = suggestOnboardingDependencies(selectedProviders.value)
  const next: DependencyDraft[] = []
  for (const s of suggestions) {
    const existing = dependencyDrafts.value.find(
      (d) => d.fromProviderSlug === s.fromSlug && d.toProviderSlug === s.toSlug,
    )
    next.push(
      existing ?? {
        fromProviderSlug: s.fromSlug,
        toProviderSlug: s.toSlug,
        relationType: s.relationType,
        enabled: true,
      },
    )
  }
  dependencyDrafts.value = next
}

async function saveDraft(): Promise<boolean> {
  saving.value = true
  lastSaved.value = false
  try {
    await $fetch('/api/onboarding', {
      method: 'PUT',
      body: {
        step: step.value,
        payload: {
          projectName: projectName.value,
          websiteUrl: resolvedWebsiteUrl(),
          websiteDomainUnverified: websiteDomainUnverified.value,
          description: description.value,
          selectedProviders: selectedProviders.value,
          resourceDrafts: resourceDrafts.value,
          dependencyDrafts: dependencyDrafts.value,
          resourceCursor: resourceCursor.value,
        },
      },
    })
    await refresh()
    lastSaved.value = true
    return true
  } catch (e: unknown) {
    stepError.value = formatApiError(e) || t('onboarding.errorFinalize')
    return false
  } finally {
    saving.value = false
  }
}

function validateStep(): boolean {
  stepError.value = ''
  if (step.value === 2 && !projectName.value.trim()) {
    stepError.value = t('onboarding.errorProjectName')
    return false
  }
  return true
}

async function goNext() {
  if (!validateStep()) return
  if (step.value === 3) {
    syncResourceDraftsFromProviders()
    resourceCursor.value = 0
  }
  if (step.value === 4 && resourceCursor.value < resourceDrafts.value.length - 1) {
    if (!(await saveDraft())) return
    resourceCursor.value++
    return
  }
  if (step.value === 4) syncDependencyDrafts()
  if (!(await saveDraft())) return
  if (step.value < TOTAL_STEPS) step.value++
}

async function goBack() {
  stepError.value = ''
  if (step.value === 4 && resourceCursor.value > 0) {
    if (!(await saveDraft())) return
    resourceCursor.value--
    return
  }
  if (!(await saveDraft())) return
  if (step.value > 1) step.value--
  if (step.value === 4) {
    resourceCursor.value = Math.max(0, resourceDrafts.value.length - 1)
  }
}

const FIRST_STEP_NEEDING_PROJECT = 3

function canNavigateToStep(target: number) {
  if (target < 1 || target > TOTAL_STEPS) return false
  if (target === step.value) return false
  if (target < step.value) return true
  if (target >= FIRST_STEP_NEEDING_PROJECT && !projectName.value.trim()) return false
  return true
}

function navigateBlockReason(target: number) {
  if (target >= FIRST_STEP_NEEDING_PROJECT && !projectName.value.trim() && target > step.value) {
    return t('onboarding.stepNavNeedProject')
  }
  return null
}

async function goToStep(target: number) {
  if (!canNavigateToStep(target)) return
  stepError.value = ''
  if (target > step.value) {
    if (target >= 4 && step.value < 4) {
      syncResourceDraftsFromProviders()
      resourceCursor.value = 0
    }
    if (target >= 5 && step.value < 5) syncDependencyDrafts()
  }
  step.value = target
  if (target === 4) syncResourceDraftsFromProviders()
  if (target < 4) resourceCursor.value = 0
  await saveDraft()
}

async function skipTools() {
  stepError.value = ''
  syncResourceDraftsFromProviders()
  resourceCursor.value = 0
  step.value = 4
  await saveDraft()
}

function toggleProvider(slug: string) {
  if (selectedProviders.value.includes(slug)) {
    selectedProviders.value = selectedProviders.value.filter((s) => s !== slug)
  } else {
    selectedProviders.value = [...selectedProviders.value, slug]
  }
}

async function finalize() {
  finalizeError.value = ''
  if (!projectName.value.trim()) {
    step.value = 2
    stepError.value = t('onboarding.errorProjectName')
    return
  }

  finishing.value = true
  try {
    syncResourceDraftsFromProviders()
    const { identities, assets, assetSetups } = buildFinalizeBundles()

    const { projectId } = await $fetch('/api/onboarding/finalize', {
      method: 'POST',
      body: {
        projectName: projectName.value.trim(),
        websiteUrl: resolvedWebsiteUrl() || undefined,
        description: description.value.trim() || undefined,
        identities,
        assets,
        assetSetups,
        dependencies: dependencyDrafts.value,
      },
    })
    await navigateTo(`/projects/${projectId}?setup=1`)
  } catch (e: unknown) {
    finalizeError.value = formatApiError(e) || t('onboarding.errorFinalize')
  } finally {
    finishing.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8 pb-12">
    <header class="space-y-2">
      <h1 class="page-title tracking-tight">{{ t('onboarding.title') }}</h1>
      <p class="lede">{{ t('onboarding.subtitle') }}</p>
      <div class="flex flex-wrap items-center gap-3 text-xs text-subtle">
        <span>{{ t('onboarding.step', { current: step, total: TOTAL_STEPS }) }}</span>
        <span v-if="saving" class="text-faint">{{ t('common.loading') }}</span>
        <span v-else-if="lastSaved" class="text-emerald-700">{{ t('onboarding.saved') }}</span>
      </div>
    </header>

    <OnboardingStepper
      :current="step"
      :total="TOTAL_STEPS"
      :labels="stepNavLabels"
      :can-navigate-to="canNavigateToStep"
      :navigate-block-reason="navigateBlockReason"
      @navigate="goToStep"
    />

    <section class="onboarding-panel">
      <!-- Step 1 -->
      <div v-if="step === 1" class="space-y-6 p-6 sm:p-8">
        <div class="space-y-2">
          <h2 class="text-lg font-semibold text-ink">{{ t('onboarding.welcomeTitle') }}</h2>
          <p class="text-sm leading-relaxed text-muted">{{ t('onboarding.welcomeBody') }}</p>
        </div>
        <ul class="space-y-3 text-sm text-ink-secondary">
          <li class="flex gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-soft text-muted">
              <IconCheck class="h-3.5 w-3.5" />
            </span>
            {{ t('onboarding.welcomeList1') }}
          </li>
          <li class="flex gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-soft text-muted">
              <IconCheck class="h-3.5 w-3.5" />
            </span>
            {{ t('onboarding.welcomeList2') }}
          </li>
          <li class="flex gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-soft text-muted">
              <IconCheck class="h-3.5 w-3.5" />
            </span>
            {{ t('onboarding.welcomeList3') }}
          </li>
        </ul>
      </div>

      <!-- Step 2 -->
      <div v-else-if="step === 2" class="space-y-5 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-ink">{{ t('onboarding.projectTitle') }}</h2>
          <p class="text-sm text-muted">{{ t('onboarding.projectHint') }}</p>
        </div>
        <div class="space-y-4">
          <label class="block text-sm">
            <span class="font-medium text-ink-secondary">{{ t('projects.name') }}</span>
            <input
              v-model="projectName"
              type="text"
              required
              autocomplete="organization"
              class="field-wizard mt-1.5"
            />
          </label>
          <div class="block text-sm">
            <span class="font-medium text-ink-secondary">{{ t('projects.website') }}</span>
            <span class="ml-1 font-normal text-faint">· {{ t('common.optional') }}</span>
            <div v-if="!websiteDomainUnverified" class="mt-1.5 flex rounded-lg border border-stone-300 dark:border-stone-600 bg-surface focus-within:border-stone-500 focus-within:ring-2 focus-within:ring-stone-200">
              <span class="flex items-center rounded-l-lg border-r border-rule bg-surface-muted px-3 text-sm text-subtle">https://</span>
              <input
                v-model="websiteHost"
                type="text"
                inputmode="url"
                :placeholder="t('onboarding.websiteHostPlaceholder')"
                class="field-wizard min-w-0 flex-1 rounded-none rounded-r-lg border-0 focus:ring-0"
              />
            </div>
            <input
              v-else
              v-model="websiteHost"
              type="text"
              :placeholder="t('onboarding.websiteUnverifiedPlaceholder')"
              class="field-wizard mt-1.5"
            />
            <label class="mt-2 flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input v-model="websiteDomainUnverified" type="checkbox" class="checkbox" />
              {{ t('onboarding.websiteUnverified') }}
            </label>
            <p class="mt-1 text-xs text-subtle">{{ t('onboarding.websiteHint') }}</p>
          </div>
          <label class="block text-sm">
            <span class="font-medium text-ink-secondary">{{ t('projects.description') }}</span>
            <textarea
              v-model="description"
              rows="3"
              class="field-wizard mt-1.5"
            />
          </label>
        </div>
        <p v-if="stepError" class="text-sm text-red-600">{{ stepError }}</p>
      </div>

      <!-- Step 3 -->
      <div v-else-if="step === 3" class="space-y-5 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-ink">{{ t('onboarding.toolsTitle') }}</h2>
          <p class="text-sm text-muted">{{ t('onboarding.toolsHint') }}</p>
        </div>
        <input
          v-model="providerSearch"
          type="search"
          :placeholder="t('onboarding.toolsSearch')"
          class="field-wizard"
        />
        <p class="text-xs text-subtle">{{ t('onboarding.toolsSelected', { count: selectedProviders.length }) }}</p>
        <div
          v-if="!groupedProviders.length"
          class="rounded-lg border border-dashed border-rule px-4 py-8 text-center text-sm text-subtle"
        >
          {{ t('onboarding.toolsEmpty') }}
        </div>
        <div v-for="[category, items] in groupedProviders" :key="category" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-subtle">{{ categoryLabel(category) }}</h3>
          <div class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="p in items"
              :key="p.slug"
              type="button"
              class="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors"
              :class="
                selectedProviders.includes(p.slug)
                  ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-300 dark:bg-stone-100 dark:text-ink'
                  : 'border-rule bg-surface-muted text-ink hover:border-stone-300 dark:border-stone-600 hover:bg-surface'
              "
              @click="toggleProvider(p.slug)"
            >
              <span class="font-medium">{{ p.name }}</span>
              <IconCheck v-if="selectedProviders.includes(p.slug)" class="h-4 w-4 shrink-0 opacity-90" />
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4 — resources -->
      <div v-else-if="step === 4" class="space-y-5 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-ink">{{ t('onboarding.resourcesTitle') }}</h2>
          <p class="text-sm text-muted">{{ t('onboarding.resourcesHint') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="inline-flex items-center gap-2 btn-quiet text-sm" @click="addCustomResource">
            <IconPlus class="h-4 w-4" />
            {{ t('onboarding.addOtherResource') }}
          </button>
          <button
            v-if="resourceDrafts[resourceCursor]?.key.startsWith('custom-')"
            type="button"
            class="inline-flex items-center gap-2 btn-quiet text-sm"
            @click="removeCurrentCustomResource"
          >
            <IconX class="h-4 w-4" />
            {{ t('onboarding.removeResource') }}
          </button>
        </div>
        <p v-if="!resourceDrafts.length" class="text-sm text-subtle">{{ t('onboarding.resourcesEmpty') }}</p>
        <template v-else>
          <OnboardingResourceStepper
            :current="resourceCursor"
            :labels="resourceStepperLabels"
            @navigate="goToResourceIndex"
          />
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-quiet text-xs" @click="applyVerifyConfirmedToRemaining">
              {{ t('onboarding.assetAccessConfirmAllRemaining') }}
            </button>
            <button type="button" class="btn-quiet text-xs" @click="applyVerifyDeclaredToRemaining">
              {{ t('onboarding.assetAccessDeclareAllRemaining') }}
            </button>
          </div>
          <OnboardingResourceStep
            v-if="resourceDrafts[resourceCursor]"
            :resource="resourceDrafts[resourceCursor]"
            :provider-name="providerBySlug.get(resourceDrafts[resourceCursor].providerSlug)?.name ?? ''"
            :index="resourceCursor"
            :total="resourceDrafts.length"
            :role-hint="
              resourceDrafts[resourceCursor].providerSlug
                ? t(roleHintKey(resourceDrafts[resourceCursor].providerSlug))
                : undefined
            "
            :default-identity-label="
              resourceDrafts[resourceCursor].providerSlug
                ? defaultIdentityLabel(resourceDrafts[resourceCursor].providerSlug)
                : ''
            "
            :prior-identities="priorIdentitiesForIndex(resourceCursor)"
            :provider-options="providerList.map((p) => ({ slug: p.slug, name: p.name }))"
            :is-custom="resourceDrafts[resourceCursor].key.startsWith('custom-')"
            :can-copy-previous="resourceCursor > 0"
            @update:resource="patchResource(resourceDrafts[resourceCursor].key, $event)"
            @copy-previous="copyPreviousResource"
          />
        </template>
      </div>

      <!-- Step 5 — dependencies -->
      <div v-else-if="step === 5" class="space-y-6 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-ink">{{ t('onboarding.connectionsTitle') }}</h2>
          <p class="text-sm text-muted">{{ t('onboarding.connectionsHint') }}</p>
        </div>
        <div v-if="dependencyDrafts.length" class="space-y-2">
          <h3 class="text-sm font-semibold text-ink">{{ t('onboarding.connectionsDeps') }}</h3>
          <p class="text-xs text-subtle">{{ t('onboarding.connectionsDepsHint') }}</p>
          <ul class="list-card text-sm">
            <li v-for="(dep, idx) in dependencyDrafts" :key="idx" class="px-3 py-2">
              <label class="flex cursor-pointer items-start gap-2">
                <input v-model="dep.enabled" type="checkbox" class="checkbox mt-1" />
                <span class="text-ink">
                  {{ providerBySlug.get(dep.fromProviderSlug)?.name ?? dep.fromProviderSlug }}
                  → {{ t(`dependencies.relationTypes.${dep.relationType}`) }} →
                  {{ providerBySlug.get(dep.toProviderSlug)?.name ?? dep.toProviderSlug }}
                </span>
              </label>
            </li>
          </ul>
        </div>
        <p v-else class="text-sm text-subtle">{{ t('onboarding.connectionsDepsEmpty') }}</p>
      </div>

      <!-- Step 6 — review -->
      <div v-else class="space-y-6 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-ink">{{ t('onboarding.reviewTitle') }}</h2>
          <p class="text-sm text-muted">{{ t('onboarding.reviewHint') }}</p>
        </div>

        <dl class="divide-y divide-rule rounded-lg border border-rule text-sm">
          <div class="grid gap-1 p-4 sm:grid-cols-3">
            <dt class="font-medium text-subtle">{{ t('onboarding.reviewProject') }}</dt>
            <dd class="sm:col-span-2">
              <p class="font-semibold text-ink">{{ projectName || '—' }}</p>
              <p v-if="resolvedWebsiteUrl()" class="text-muted">{{ resolvedWebsiteUrl() }}</p>
              <p v-if="description" class="mt-1 text-muted">{{ description }}</p>
            </dd>
          </div>
          <div class="grid gap-1 p-4 sm:grid-cols-3">
            <dt class="font-medium text-subtle">{{ t('onboarding.reviewProviders') }}</dt>
            <dd class="sm:col-span-2">
              <p v-if="!selectedProviders.length" class="text-subtle">{{ t('onboarding.reviewNone') }}</p>
              <ul v-else class="flex flex-wrap gap-2">
                <li
                  v-for="slug in selectedProviders"
                  :key="slug"
                  class="rounded-full bg-surface-soft px-2.5 py-0.5 text-ink"
                >
                  {{ providerBySlug.get(slug)?.name ?? slug }}
                </li>
              </ul>
            </dd>
          </div>
          <div class="grid gap-1 p-4 sm:grid-cols-3">
            <dt class="font-medium text-subtle">{{ t('onboarding.reviewResources') }}</dt>
            <dd class="sm:col-span-2">
              <ul v-if="activeResourceDrafts.length" class="space-y-2 text-sm">
                <li v-for="r in activeResourceDrafts" :key="r.key">
                  <span class="font-medium text-ink">{{ r.name }}</span>
                  <span class="text-subtle"> · {{ t(`assets.types.${r.type}`, r.type) }}</span>
                  <span v-if="r.identityLabel.trim()" class="text-muted">
                    · {{ r.identityLabel }} ({{ t(`assets.roles.${r.roleType}`) }})
                    · {{ t(`verification.${r.verificationStatus}`) }}
                  </span>
                </li>
              </ul>
              <p v-else class="text-subtle">{{ t('onboarding.reviewNone') }}</p>
            </dd>
          </div>
        </dl>

        <div class="rounded-lg border border-rule bg-stone-50/80 dark:bg-stone-900/80 dark:bg-stone-900/80 p-4 text-sm text-ink-secondary">
          <p class="font-medium text-ink">{{ t('onboarding.reviewNextSteps') }}</p>
          <p class="mt-1 text-muted">{{ t('onboarding.reviewNextStepsHint') }}</p>
        </div>

        <p v-if="finalizeError" class="text-sm text-red-600">{{ finalizeError }}</p>
      </div>

      <footer
        class="flex flex-col-reverse gap-3 border-t border-rule-light bg-stone-50/80 dark:bg-stone-900/80 dark:bg-stone-900/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"
      >
        <div class="flex flex-wrap gap-2">
          <button
            v-if="step > 1"
            type="button"
            class="btn-secondary-wizard"
            :disabled="saving || finishing"
            @click="goBack"
          >
            <IconChevronLeft class="h-4 w-4" />
            {{ t('onboarding.back') }}
          </button>
          <button
            v-if="step === 3"
            type="button"
            class="btn-quiet"
            :disabled="saving || finishing"
            @click="skipTools"
          >
            {{ t('onboarding.skipStep') }}
          </button>
        </div>

        <button
          v-if="step < TOTAL_STEPS"
          type="button"
          class="btn-wizard"
          :disabled="saving"
          @click="goNext"
        >
          {{ continueLabel }}
          <IconChevronRight class="h-4 w-4" />
        </button>
        <button
          v-else
          type="button"
          class="btn-wizard"
          :disabled="finishing"
          @click="finalize"
        >
          {{ finishing ? t('onboarding.finishing') : t('onboarding.finish') }}
        </button>
      </footer>
    </section>
  </div>
</template>
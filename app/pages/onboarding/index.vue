<script setup lang="ts">
import { ASSET_TYPE_KEYS } from '~/constants/inventory'
import { onboardingDefaultForProvider, suggestOnboardingDependencies } from '~/constants/onboardingDefaults'

const ASSET_TYPES = ASSET_TYPE_KEYS
import { ONBOARDING_MAX_STEP } from '~/constants/onboarding'

const TOTAL_STEPS = ONBOARDING_MAX_STEP

type ProviderRow = {
  slug: string
  name: string
  category: string | null
}

type IdentityDraft = {
  label: string
  providerSlug: string
  unsure: boolean
  loginEmail: string
}

type AccessLinkDraft = {
  identityLabel: string
  providerSlug: string
  roleType: string
  enabled: boolean
}

type DependencyDraft = {
  fromProviderSlug: string
  toProviderSlug: string
  relationType: string
  enabled: boolean
}

type AssetDraft = {
  name: string
  type: string
  providerSlug: string
  unsure: boolean
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
const identityDrafts = ref<IdentityDraft[]>([])
const assetDrafts = ref<AssetDraft[]>([])
const accessLinks = ref<AccessLinkDraft[]>([])
const dependencyDrafts = ref<DependencyDraft[]>([])

const stepNavLabels = computed(() => [
  t('onboarding.navWelcome'),
  t('onboarding.navProject'),
  t('onboarding.navTools'),
  t('onboarding.navAccounts'),
  t('onboarding.navAssets'),
  t('onboarding.navConnections'),
  t('onboarding.navReview'),
])

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
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
})

function categoryLabel(category: string) {
  const key = `onboarding.categories.${category}` as const
  const translated = t(key)
  return translated !== key ? translated : category
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
  if (Array.isArray(p.identityDrafts)) {
    identityDrafts.value = (p.identityDrafts as Partial<IdentityDraft>[]).map((i) => ({
      label: String(i.label ?? ''),
      providerSlug: String(i.providerSlug ?? ''),
      unsure: Boolean(i.unsure),
      loginEmail: typeof i.loginEmail === 'string' ? i.loginEmail : '',
    }))
  }
  if (Array.isArray(p.assetDrafts)) {
    assetDrafts.value = (p.assetDrafts as Partial<AssetDraft>[]).map((a) => ({
      name: String(a.name ?? ''),
      type: String(a.type ?? 'service'),
      providerSlug: String(a.providerSlug ?? ''),
      unsure: Boolean(a.unsure),
      enabled: a.enabled ?? true,
    }))
  }
  if (Array.isArray(p.accessLinks)) accessLinks.value = p.accessLinks as AccessLinkDraft[]
  if (Array.isArray(p.dependencyDrafts)) dependencyDrafts.value = p.dependencyDrafts as DependencyDraft[]
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
    identityDrafts: identityDrafts.value,
    assetDrafts: assetDrafts.value,
    accessLinks: accessLinks.value,
    dependencyDrafts: dependencyDrafts.value,
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

function syncIdentityDraftsFromProviders() {
  const slugs = selectedProviders.value
  const bySlug = new Map(identityDrafts.value.filter((i) => i.providerSlug).map((i) => [i.providerSlug, i]))
  const customs = identityDrafts.value.filter((i) => !i.providerSlug)
  const next: IdentityDraft[] = []
  for (const slug of slugs) {
    next.push(
      bySlug.get(slug) ?? {
        label: defaultIdentityLabel(slug),
        providerSlug: slug,
        unsure: false,
        loginEmail: '',
      },
    )
  }
  identityDrafts.value = [...next, ...customs]
  if (!identityDrafts.value.length) {
    identityDrafts.value.push({ label: '', providerSlug: '', unsure: false, loginEmail: '' })
  }
}

function syncAssetDraftsFromProviders() {
  const slugs = selectedProviders.value
  const bySlug = new Map(assetDrafts.value.map((a) => [a.providerSlug, a]))
  const next: AssetDraft[] = []
  for (const slug of slugs) {
    const defaults = onboardingDefaultForProvider(slug)
    const existing = bySlug.get(slug)
    next.push(
      existing ?? {
        name: t(defaults.assetNameKey, { project: projectName.value.trim() || t('onboarding.sampleProject') }),
        type: defaults.assetType,
        providerSlug: slug,
        unsure: false,
        enabled: true,
      },
    )
  }
  assetDrafts.value = next
}

function syncAccessLinkDrafts() {
  const next: AccessLinkDraft[] = []
  for (const id of identityDrafts.value) {
    if (id.unsure || !id.label.trim() || !id.providerSlug) continue
    const asset = assetDrafts.value.find((a) => a.providerSlug === id.providerSlug && a.enabled)
    if (!asset) continue
    const existing = accessLinks.value.find(
      (l) => l.identityLabel === id.label && l.providerSlug === id.providerSlug,
    )
    next.push(
      existing ?? {
        identityLabel: id.label,
        providerSlug: id.providerSlug,
        roleType: 'admin',
        enabled: true,
      },
    )
  }
  accessLinks.value = next
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
          identityDrafts: identityDrafts.value,
          assetDrafts: assetDrafts.value,
          accessLinks: accessLinks.value,
          dependencyDrafts: dependencyDrafts.value,
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
  if (step.value === 3) syncIdentityDraftsFromProviders()
  if (step.value === 4) syncAssetDraftsFromProviders()
  if (step.value === 5) {
    syncAccessLinkDrafts()
    syncDependencyDrafts()
  }
  if (!(await saveDraft())) return
  if (step.value < TOTAL_STEPS) step.value++
}

async function goBack() {
  stepError.value = ''
  if (!(await saveDraft())) return
  if (step.value > 1) step.value--
}

async function skipTools() {
  stepError.value = ''
  syncIdentityDraftsFromProviders()
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

function addIdentityRow() {
  identityDrafts.value.push({ label: '', providerSlug: '', unsure: false })
}

function removeIdentityRow(index: number) {
  identityDrafts.value.splice(index, 1)
  if (!identityDrafts.value.length) {
    identityDrafts.value.push({ label: '', providerSlug: '', unsure: false, loginEmail: '' })
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
    syncAssetDraftsFromProviders()
    const assets = assetDrafts.value
      .filter((a) => a.enabled && !a.unsure && a.name.trim())
      .map(({ name, type, providerSlug, unsure }) => ({ name, type, providerSlug, unsure }))

    for (const slug of selectedProviders.value) {
      if (!assets.find((a) => a.providerSlug === slug)) {
        const name = providerBySlug.value.get(slug)?.name ?? slug
        assets.push({ name: `${name} — main`, type: 'service', providerSlug: slug, unsure: false })
      }
    }

    const { projectId } = await $fetch('/api/onboarding/finalize', {
      method: 'POST',
      body: {
        projectName: projectName.value.trim(),
        websiteUrl: resolvedWebsiteUrl() || undefined,
        description: description.value.trim() || undefined,
        identities: identityDrafts.value,
        assets,
        accessLinks: accessLinks.value,
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
      <div class="flex flex-wrap items-center gap-3 text-xs text-stone-500">
        <span>{{ t('onboarding.step', { current: step, total: TOTAL_STEPS }) }}</span>
        <span v-if="saving" class="text-stone-400">{{ t('common.loading') }}</span>
        <span v-else-if="lastSaved" class="text-emerald-700">{{ t('onboarding.saved') }}</span>
      </div>
    </header>

    <OnboardingStepper :current="step" :total="TOTAL_STEPS" :labels="stepNavLabels" />

    <section class="rounded-xl border border-stone-200 bg-white shadow-sm">
      <!-- Step 1 -->
      <div v-if="step === 1" class="space-y-6 p-6 sm:p-8">
        <div class="space-y-2">
          <h2 class="text-lg font-semibold text-stone-900">{{ t('onboarding.welcomeTitle') }}</h2>
          <p class="text-sm leading-relaxed text-stone-600">{{ t('onboarding.welcomeBody') }}</p>
        </div>
        <ul class="space-y-3 text-sm text-stone-700">
          <li class="flex gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
              <IconCheck class="h-3.5 w-3.5" />
            </span>
            {{ t('onboarding.welcomeList1') }}
          </li>
          <li class="flex gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
              <IconCheck class="h-3.5 w-3.5" />
            </span>
            {{ t('onboarding.welcomeList2') }}
          </li>
          <li class="flex gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
              <IconCheck class="h-3.5 w-3.5" />
            </span>
            {{ t('onboarding.welcomeList3') }}
          </li>
        </ul>
      </div>

      <!-- Step 2 -->
      <div v-else-if="step === 2" class="space-y-5 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-stone-900">{{ t('onboarding.projectTitle') }}</h2>
          <p class="text-sm text-stone-600">{{ t('onboarding.projectHint') }}</p>
        </div>
        <div class="space-y-4">
          <label class="block text-sm">
            <span class="font-medium text-stone-700">{{ t('projects.name') }}</span>
            <input
              v-model="projectName"
              type="text"
              required
              autocomplete="organization"
              class="field-wizard mt-1.5"
            />
          </label>
          <div class="block text-sm">
            <span class="font-medium text-stone-700">{{ t('projects.website') }}</span>
            <span class="ml-1 font-normal text-stone-400">· {{ t('common.optional') }}</span>
            <div v-if="!websiteDomainUnverified" class="mt-1.5 flex rounded-lg border border-stone-300 bg-white focus-within:border-stone-500 focus-within:ring-2 focus-within:ring-stone-200">
              <span class="flex items-center rounded-l-lg border-r border-stone-200 bg-stone-50 px-3 text-sm text-stone-500">https://</span>
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
            <label class="mt-2 flex cursor-pointer items-center gap-2 text-sm text-stone-600">
              <input v-model="websiteDomainUnverified" type="checkbox" class="rounded border-stone-300" />
              {{ t('onboarding.websiteUnverified') }}
            </label>
            <p class="mt-1 text-xs text-stone-500">{{ t('onboarding.websiteHint') }}</p>
          </div>
          <label class="block text-sm">
            <span class="font-medium text-stone-700">{{ t('projects.description') }}</span>
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
          <h2 class="text-lg font-semibold text-stone-900">{{ t('onboarding.toolsTitle') }}</h2>
          <p class="text-sm text-stone-600">{{ t('onboarding.toolsHint') }}</p>
        </div>
        <input
          v-model="providerSearch"
          type="search"
          :placeholder="t('onboarding.toolsSearch')"
          class="field-wizard"
        />
        <p class="text-xs text-stone-500">{{ t('onboarding.toolsSelected', { count: selectedProviders.length }) }}</p>
        <div
          v-if="!groupedProviders.length"
          class="rounded-lg border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500"
        >
          {{ t('onboarding.toolsEmpty') }}
        </div>
        <div v-for="[category, items] in groupedProviders" :key="category" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-stone-500">{{ categoryLabel(category) }}</h3>
          <div class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="p in items"
              :key="p.slug"
              type="button"
              class="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors"
              :class="
                selectedProviders.includes(p.slug)
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white'
              "
              @click="toggleProvider(p.slug)"
            >
              <span class="font-medium">{{ p.name }}</span>
              <IconCheck v-if="selectedProviders.includes(p.slug)" class="h-4 w-4 shrink-0 opacity-90" />
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4 -->
      <div v-else-if="step === 4" class="space-y-5 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-stone-900">{{ t('onboarding.accountsTitle') }}</h2>
          <p class="text-sm text-stone-600">{{ t('onboarding.accountsHint') }}</p>
        </div>
        <div class="space-y-3">
          <div
            v-for="(id, idx) in identityDrafts"
            :key="idx"
            class="rounded-lg border border-stone-200 bg-stone-50/80 p-3 sm:p-4"
          >
            <p v-if="id.providerSlug && !id.unsure" class="mb-2 text-xs text-stone-500">
              {{ t(roleHintKey(id.providerSlug)) }}
            </p>
            <div class="grid gap-3 sm:grid-cols-[1fr,minmax(8rem,10rem),auto] sm:items-end">
              <label class="block text-sm">
                <span class="font-medium text-stone-700">{{ t('onboarding.identityLabel') }}</span>
                <input
                  v-model="id.label"
                  type="text"
                  :placeholder="t('accounts.identityLabel')"
                  :disabled="id.unsure"
                  class="field-wizard mt-1"
                />
              </label>
              <label class="block text-sm">
                <span class="font-medium text-stone-700">{{ t('onboarding.identityProvider') }}</span>
                <select
                  v-model="id.providerSlug"
                  :disabled="id.unsure"
                  class="field-wizard mt-1"
                >
                  <option value="">{{ t('accounts.noProvider') }}</option>
                  <option v-for="p in providerList" :key="p.slug" :value="p.slug">{{ p.name }}</option>
                </select>
              </label>
              <div class="flex items-center justify-between gap-2 sm:flex-col sm:items-stretch">
                <label class="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
                  <input v-model="id.unsure" type="checkbox" class="rounded border-stone-300" />
                  {{ t('onboarding.notSure') }}
                </label>
                <button
                  v-if="identityDrafts.length > 1"
                  type="button"
                  class="inline-flex items-center justify-center gap-1 rounded border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
                  @click="removeIdentityRow(idx)"
                >
                  <IconX class="h-3.5 w-3.5" />
                  {{ t('onboarding.removeIdentity') }}
                </button>
              </div>
            </div>
            <label v-if="!id.unsure" class="mt-3 block text-sm">
              <span class="font-medium text-stone-700">{{ t('onboarding.identityLoginEmail') }}</span>
              <span class="ml-1 font-normal text-stone-400">· {{ t('common.optional') }}</span>
              <input
                v-model="id.loginEmail"
                type="email"
                class="field-wizard mt-1"
                :placeholder="t('onboarding.identityLoginEmailPlaceholder')"
              />
            </label>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900"
          @click="addIdentityRow"
        >
          <IconPlus class="h-4 w-4" />
          {{ t('onboarding.addIdentity') }}
        </button>
      </div>

      <!-- Step 5 — assets -->
      <div v-else-if="step === 5" class="space-y-5 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-stone-900">{{ t('onboarding.assetsTitle') }}</h2>
          <p class="text-sm text-stone-600">{{ t('onboarding.assetsHint') }}</p>
        </div>
        <div v-if="!selectedProviders.length" class="text-sm text-stone-500">{{ t('onboarding.noProvidersSelected') }}</div>
        <div v-else class="space-y-3">
          <div
            v-for="asset in assetDrafts"
            :key="asset.providerSlug"
            class="rounded-lg border border-stone-200 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <label class="flex items-center gap-2 text-sm font-medium text-stone-800">
                <input v-model="asset.enabled" type="checkbox" class="rounded border-stone-300" />
                {{ providerBySlug.get(asset.providerSlug)?.name ?? asset.providerSlug }}
              </label>
              <span class="text-xs text-stone-500">{{ t('onboarding.assetTypeLabel') }}</span>
            </div>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label class="block text-sm sm:col-span-2">
                <span class="font-medium text-stone-700">{{ t('onboarding.assetResourceName') }}</span>
                <input v-model="asset.name" type="text" :disabled="!asset.enabled" class="field-wizard mt-1" />
              </label>
              <label class="block text-sm sm:col-span-2">
                <span class="font-medium text-stone-700">{{ t('assets.type') }}</span>
                <select v-model="asset.type" :disabled="!asset.enabled" class="field-wizard mt-1">
                  <option v-for="ty in ASSET_TYPES" :key="ty" :value="ty">{{ t(`assets.types.${ty}`) }}</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 6 — connections -->
      <div v-else-if="step === 6" class="space-y-6 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-stone-900">{{ t('onboarding.connectionsTitle') }}</h2>
          <p class="text-sm text-stone-600">{{ t('onboarding.connectionsHint') }}</p>
        </div>
        <div v-if="accessLinks.length" class="space-y-2">
          <h3 class="text-sm font-semibold text-stone-800">{{ t('onboarding.connectionsAccess') }}</h3>
          <p class="text-xs text-stone-500">{{ t('onboarding.connectionsAccessHint') }}</p>
          <ul class="list-card text-sm">
            <li v-for="(link, idx) in accessLinks" :key="idx" class="flex flex-wrap items-center gap-3 px-3 py-2">
              <label class="flex flex-1 cursor-pointer items-center gap-2">
                <input v-model="link.enabled" type="checkbox" class="rounded border-stone-300" />
                <span class="text-stone-800">
                  <span class="font-medium">{{ link.identityLabel }}</span>
                  <span class="text-stone-500"> → {{ providerBySlug.get(link.providerSlug)?.name ?? link.providerSlug }}</span>
                </span>
              </label>
            </li>
          </ul>
        </div>
        <p v-else class="text-sm text-stone-500">{{ t('onboarding.connectionsAccessEmpty') }}</p>
        <div v-if="dependencyDrafts.length" class="space-y-2">
          <h3 class="text-sm font-semibold text-stone-800">{{ t('onboarding.connectionsDeps') }}</h3>
          <p class="text-xs text-stone-500">{{ t('onboarding.connectionsDepsHint') }}</p>
          <ul class="list-card text-sm">
            <li v-for="(dep, idx) in dependencyDrafts" :key="idx" class="px-3 py-2">
              <label class="flex cursor-pointer items-start gap-2">
                <input v-model="dep.enabled" type="checkbox" class="mt-1 rounded border-stone-300" />
                <span class="text-stone-800">
                  {{ providerBySlug.get(dep.fromProviderSlug)?.name ?? dep.fromProviderSlug }}
                  → {{ t(`dependencies.relationTypes.${dep.relationType}`) }} →
                  {{ providerBySlug.get(dep.toProviderSlug)?.name ?? dep.toProviderSlug }}
                </span>
              </label>
            </li>
          </ul>
        </div>
        <p v-else class="text-sm text-stone-500">{{ t('onboarding.connectionsDepsEmpty') }}</p>
      </div>

      <!-- Step 7 — review -->
      <div v-else class="space-y-6 p-6 sm:p-8">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-stone-900">{{ t('onboarding.reviewTitle') }}</h2>
          <p class="text-sm text-stone-600">{{ t('onboarding.reviewHint') }}</p>
        </div>

        <dl class="divide-y divide-stone-100 rounded-lg border border-stone-200 text-sm">
          <div class="grid gap-1 p-4 sm:grid-cols-3">
            <dt class="font-medium text-stone-500">{{ t('onboarding.reviewProject') }}</dt>
            <dd class="sm:col-span-2">
              <p class="font-semibold text-stone-900">{{ projectName || '—' }}</p>
              <p v-if="resolvedWebsiteUrl()" class="text-stone-600">{{ resolvedWebsiteUrl() }}</p>
              <p v-if="description" class="mt-1 text-stone-600">{{ description }}</p>
            </dd>
          </div>
          <div class="grid gap-1 p-4 sm:grid-cols-3">
            <dt class="font-medium text-stone-500">{{ t('onboarding.reviewProviders') }}</dt>
            <dd class="sm:col-span-2">
              <p v-if="!selectedProviders.length" class="text-stone-500">{{ t('onboarding.reviewNone') }}</p>
              <ul v-else class="flex flex-wrap gap-2">
                <li
                  v-for="slug in selectedProviders"
                  :key="slug"
                  class="rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-800"
                >
                  {{ providerBySlug.get(slug)?.name ?? slug }}
                </li>
              </ul>
            </dd>
          </div>
          <div class="grid gap-1 p-4 sm:grid-cols-3">
            <dt class="font-medium text-stone-500">{{ t('onboarding.reviewIdentities') }}</dt>
            <dd class="sm:col-span-2">
              <ul class="space-y-1">
                <li v-for="(id, idx) in identityDrafts" :key="idx" class="text-stone-800">
                  <span v-if="id.unsure || !id.label.trim()" class="text-stone-400">{{ t('onboarding.reviewSkipped') }}</span>
                  <span v-else>{{ id.label }}</span>
                  <span v-if="id.providerSlug && !id.unsure" class="text-stone-500">
                    — {{ providerBySlug.get(id.providerSlug)?.name ?? id.providerSlug }}
                  </span>
                </li>
              </ul>
            </dd>
          </div>
        </dl>

        <div class="rounded-lg border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-700">
          <p class="font-medium text-stone-900">{{ t('onboarding.reviewNextSteps') }}</p>
          <p class="mt-1 text-stone-600">{{ t('onboarding.reviewNextStepsHint') }}</p>
        </div>

        <p v-if="finalizeError" class="text-sm text-red-600">{{ finalizeError }}</p>
      </div>

      <footer
        class="flex flex-col-reverse gap-3 border-t border-stone-100 bg-stone-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"
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
          {{ t('onboarding.continue') }}
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
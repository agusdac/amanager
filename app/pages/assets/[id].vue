<script setup lang="ts">
import type { AssetAttributes } from '#shared/schemas/assetAttributes'
import {
  ASSET_TYPES_WITH_VAULT_HINT,
  ASSET_TYPE_KEYS,
  assetTypeShowsAdminUrl,
  assetTypeShowsPublicUrl,
  CONFIG_ENTRY_KEY_PRESETS,
  NEEDS_CONFIRMATION_VERIFICATION_STATUSES,
  VERIFICATION_METHOD_KEYS,
  VERIFICATION_STATUS_KEYS,
} from '~/constants/inventory'

const ACCESS_ROLES = ['admin', 'operator', 'owner', 'developer', 'billing', 'viewer', 'other'] as const
const CRITICALITY = ['low', 'medium', 'high', 'critical'] as const
const assetTypeOptions = ASSET_TYPE_KEYS
const verificationMethods = VERIFICATION_METHOD_KEYS

const { t, te } = useI18n()
const route = useRoute()
const assetId = computed(() => String(route.params.id))

const { data, refresh, pending } = await useFetch(() => `/api/assets/${assetId.value}`, { watch: [assetId] })
const { data: providers } = await useFetch('/api/providers')
const { data: identities } = await useFetch('/api/identities')
const { data: accounts } = await useFetch('/api/provider-accounts')
const { data: assetList } = await useFetch('/api/assets?limit=100')

const name = ref('')
const type = ref('')
const description = ref('')
const adminUrl = ref('')
const publicUrl = ref('')
const providerId = ref('')
const providerAccountId = ref('')
const criticality = ref('medium')
const verificationStatus = ref<(typeof VERIFICATION_STATUS_KEYS)[number]>('declared')
const saveError = ref('')
const saving = ref(false)
const passwordManagerItemUrl = ref('')
const emailPmUrls = ref<Record<string, string>>({})

const newRoleIdentityId = ref('')
const pickerIdentityEmails = ref<{ address: string; purpose: string }[]>([])
const newRoleType = ref<(typeof ACCESS_ROLES)[number]>('admin')
const accessError = ref('')
const accessWarning = ref('')
const accessSuccess = ref('')
const verifyMethod = ref<(typeof verificationMethods)[number]>('dns_txt')
const verifyNote = ref('')
const verifyError = ref('')
const verifyLoading = ref(false)
const verifyAssigneeUserId = ref<string | null>(null)

const configPreset = ref<(typeof CONFIG_ENTRY_KEY_PRESETS)[number]>('oauth_client_id')
const configCustomKey = ref('')
const configPublicValue = ref('')
const configDescription = ref('')
const configValueType = ref<'string' | 'url' | 'boolean'>('string')
const configSensitive = ref(false)
const configError = ref('')
const configLoading = ref(false)
const vaultRefLabel = ref('')
const vaultRefLocation = ref('')
const vaultRefItemUrl = ref('')
const vaultRefError = ref('')
const vaultRefLoading = ref(false)
const depRemovingId = ref<string | null>(null)

const impactAssets = computed(() =>
  (assetList.value?.assets ?? []).map((a: { id: string; name: string }) => ({ id: a.id, label: a.name })),
)
const impactIdentities = computed(() =>
  (identities.value?.identities ?? []).map((i: { id: string; label: string }) => ({
    id: i.id,
    label: i.label,
  })),
)

const typeDescription = computed(() => {
  const key = `assets.typeDescriptions.${type.value}`
  return te(key) ? t(key) : ''
})

watch(
  data,
  (d) => {
    if (!d?.asset) return
    name.value = d.asset.name
    type.value = d.asset.type
    description.value = d.asset.description ?? ''
    adminUrl.value = d.asset.adminUrl ?? ''
    publicUrl.value = d.asset.publicUrl ?? ''
    providerId.value = d.asset.providerId ?? ''
    providerAccountId.value = d.asset.providerAccountId ?? ''
    criticality.value = d.asset.criticality ?? 'medium'
    verificationStatus.value = (d.asset.verificationStatus ??
      'declared') as (typeof VERIFICATION_STATUS_KEYS)[number]
    passwordManagerItemUrl.value = d.asset.passwordManagerItemUrl ?? ''
    const pm: Record<string, string> = {}
    for (const em of d.emails ?? []) {
      pm[em.id] = em.passwordManagerItemUrl ?? ''
    }
    emailPmUrls.value = pm
  },
  { immediate: true },
)

const showVaultLinkField = computed(() =>
  (ASSET_TYPES_WITH_VAULT_HINT as readonly string[]).includes(type.value),
)
const showAdminUrl = computed(() => assetTypeShowsAdminUrl(type.value))
const showPublicUrl = computed(() => assetTypeShowsPublicUrl(type.value))

const filteredProviderAccounts = computed(() => {
  const list = accounts.value?.accounts ?? []
  if (!providerId.value) return list
  return list.filter((a) => !a.providerId || a.providerId === providerId.value)
})

const assetLinkedEmailAddresses = computed(
  () => new Set((data.value?.emails ?? []).map((e) => e.address.trim().toLowerCase())),
)

function emailAlreadyOnAsset(address: string) {
  return assetLinkedEmailAddresses.value.has(address.trim().toLowerCase())
}

watch(
  [newRoleIdentityId, () => data.value?.roles],
  async ([identityId]) => {
    pickerIdentityEmails.value = []
    if (!identityId) return
    const fromRole = data.value?.roles?.find((r) => r.identityId === identityId)?.identityEmails
    if (fromRole?.length) {
      pickerIdentityEmails.value = fromRole
      return
    }
    try {
      const detail = await $fetch<{ emails: { address: string; purpose: string }[] }>(
        `/api/identities/${identityId}`,
      )
      pickerIdentityEmails.value = detail.emails ?? []
    } catch {
      pickerIdentityEmails.value = []
    }
  },
)

watch(type, () => {
  if (!showAdminUrl.value) adminUrl.value = ''
  if (!showPublicUrl.value) publicUrl.value = ''
})

watch(providerId, (next) => {
  if (!next) return
  const ok = filteredProviderAccounts.value.some((a) => a.id === providerAccountId.value)
  if (providerAccountId.value && !ok) providerAccountId.value = ''
})

const needsConfirmation = computed(() =>
  (NEEDS_CONFIRMATION_VERIFICATION_STATUSES as readonly string[]).includes(
    data.value?.asset?.verificationStatus ?? '',
  ),
)

const primaryProjectWebsite = computed(
  () => data.value?.projects?.[0]?.projectWebsiteUrl ?? projectGraphPack.value?.project?.websiteUrl ?? null,
)

const projectAssetOptions = computed(
  () =>
    projectGraphPack.value?.assets?.map((a: { id: string; name: string; type: string }) => ({
      id: a.id,
      name: a.name,
      type: a.type,
    })) ?? [],
)

const assetAttributes = computed(
  () => (data.value?.asset?.attributesJson ?? null) as AssetAttributes | null,
)

const primaryProjectId = computed(() => data.value?.projects?.[0]?.projectId)

const projectGraphUrl = computed(() =>
  primaryProjectId.value ? `/api/projects/${primaryProjectId.value}` : null,
)
const { data: projectGraphPack, refresh: refreshProjectGraph } = await useFetch(projectGraphUrl, {
  watch: [projectGraphUrl],
})

const envLinkSaving = ref(false)

async function setProjectEnvironment(projectId: string, rawEnvironmentId: string) {
  envLinkSaving.value = true
  try {
    await $fetch('/api/project-assets', {
      method: 'PATCH',
      body: {
        projectId,
        assetId: assetId.value,
        environmentId: rawEnvironmentId || null,
      },
    })
    await Promise.all([refresh(), refreshProjectGraph()])
  } finally {
    envLinkSaving.value = false
  }
}

const projectGraphNodes = computed(() =>
  (projectGraphPack.value?.assets ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    providerSlug: a.providerSlug,
    verificationStatus: a.verificationStatus,
  })),
)

const projectGraphEdges = computed(() =>
  (projectGraphPack.value?.dependencies ?? []).map((d) => ({
    id: d.id,
    from: d.fromAssetId,
    to: d.toAssetId,
    relationType: d.relationType,
    verificationStatus: d.verificationStatus,
  })),
)

const projectGraphStorageKey = computed(() =>
  primaryProjectId.value ? `dep-graph-${primaryProjectId.value}` : null,
)

useAppPageTitle(
  computed(() => (data.value?.asset?.name ? data.value.asset.name : t('pageTitles.loading'))),
)

watch(
  () => route.query.openAction,
  (openAction) => {
    if (typeof openAction === 'string' && openAction) {
      void navigateTo(`/actions/${openAction}`)
    }
  },
  { immediate: true },
)

const assetTabs = computed(() => [
  { id: 'overview', label: t('tabs.assets.overview') },
  { id: 'access', label: t('tabs.assets.access') },
  { id: 'dependencies', label: t('tabs.assets.dependencies') },
  { id: 'config', label: t('tabs.assets.config') },
  { id: 'actions', label: t('tabs.assets.actions') },
  { id: 'verifications', label: t('tabs.assets.verifications') },
  {
    id: 'map',
    label: t('tabs.assets.map'),
    visible: Boolean(primaryProjectId.value && projectGraphEdges.value.length),
  },
  { id: 'impact', label: t('tabs.assets.impact') },
])

async function saveMetadata() {
  saveError.value = ''
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      name: name.value.trim(),
      type: type.value,
      description: description.value.trim() || null,
      adminUrl: adminUrl.value.trim(),
      publicUrl: publicUrl.value.trim(),
      providerId: providerId.value || null,
      providerAccountId: providerAccountId.value || null,
      criticality: criticality.value,
      verificationStatus: verificationStatus.value,
    }
    if (showVaultLinkField.value) {
      body.passwordManagerItemUrl = passwordManagerItemUrl.value.trim()
    }
    await $fetch(`/api/assets/${assetId.value}`, {
      method: 'PATCH',
      body,
    })
    await refresh()
  } catch (e: unknown) {
    saveError.value = formatApiError(e)
  } finally {
    saving.value = false
  }
}

async function onLoginEmailLinked() {
  await refresh()
}

async function addRole() {
  accessError.value = ''
  accessWarning.value = ''
  accessSuccess.value = ''
  if (!identities.value?.identities?.length) {
    accessWarning.value = t('assets.accessNoIdentities')
    return
  }
  if (!newRoleIdentityId.value) {
    accessWarning.value = t('assets.accessIdentityRequired')
    return
  }
  try {
    await $fetch('/api/asset-roles', {
      method: 'POST',
      body: {
        assetId: assetId.value,
        identityId: newRoleIdentityId.value,
        roleType: newRoleType.value,
      },
    })
    accessSuccess.value = t('assets.accessRoleAdded')
    await refresh()
  } catch (e: unknown) {
    accessError.value = formatApiError(e)
  }
}

async function confirmControlQuick() {
  verifyMethod.value = 'provider_console'
  await addVerification('confirmed_by_human')
}

async function addVerification(
  outcome: (typeof VERIFICATION_STATUS_KEYS)[number] = 'confirmed_by_human',
) {
  verifyError.value = ''
  verifyLoading.value = true
  try {
    await $fetch('/api/verifications', {
      method: 'POST',
      body: {
        sourceType: 'asset',
        sourceId: assetId.value,
        method: verifyMethod.value,
        evidenceNote: verifyNote.value.trim() || undefined,
        status: outcome,
        assigneeUserId: verifyAssigneeUserId.value,
      },
    })
    verifyNote.value = ''
    await refresh()
  } catch (e: unknown) {
    verifyError.value = formatApiError(e)
  } finally {
    verifyLoading.value = false
  }
}

function verificationMethodLabel(method: string) {
  const key = `verificationMethods.${method}`
  return te(key) ? t(key) : method.replaceAll('_', ' ')
}

function configKeyLabel(key: string) {
  const i18nKey = `assets.configKeys.${key}`
  return te(i18nKey) ? t(i18nKey) : key.replaceAll('_', ' ')
}

const resolvedConfigKey = computed(() =>
  configPreset.value === 'custom' ? configCustomKey.value.trim() : configPreset.value,
)

async function addConfigEntry() {
  configError.value = ''
  if (!resolvedConfigKey.value) {
    configError.value = t('assets.configKeyRequired')
    return
  }
  configLoading.value = true
  try {
    await $fetch('/api/config-entries', {
      method: 'POST',
      body: {
        assetId: assetId.value,
        projectId: primaryProjectId.value ?? null,
        key: resolvedConfigKey.value,
        description: configDescription.value.trim() || undefined,
        valueType: configValueType.value,
        publicValue: configSensitive.value ? undefined : configPublicValue.value.trim() || undefined,
        isSensitiveReference: configSensitive.value,
      },
    })
    configPublicValue.value = ''
    configDescription.value = ''
    configCustomKey.value = ''
    await refresh()
  } catch (e: unknown) {
    configError.value = formatApiError(e)
  } finally {
    configLoading.value = false
  }
}

async function saveTypeAttributes(attributes: AssetAttributes) {
  await $fetch(`/api/assets/${assetId.value}`, {
    method: 'PATCH',
    body: { attributes },
  })
  await refresh()
}

async function saveAssetVaultLink() {
  await $fetch(`/api/assets/${assetId.value}`, {
    method: 'PATCH',
    body: { passwordManagerItemUrl: passwordManagerItemUrl.value.trim() || '' },
  })
  await refresh()
}

async function saveEmailVaultLink(assetEmailId: string) {
  await $fetch(`/api/asset-emails/${assetEmailId}`, {
    method: 'PATCH',
    body: { passwordManagerItemUrl: emailPmUrls.value[assetEmailId]?.trim() || '' },
  })
  await refresh()
}


async function removeDependency(dependencyId: string) {
  depRemovingId.value = dependencyId
  try {
    await $fetch(`/api/dependencies/${dependencyId}`, { method: 'DELETE' })
    await Promise.all([refresh(), refreshProjectGraph()])
  } finally {
    depRemovingId.value = null
  }
}

async function onDependencyLinked() {
  await Promise.all([refresh(), refreshProjectGraph()])
}

async function addVaultReference() {
  vaultRefError.value = ''
  const label = vaultRefLabel.value.trim()
  const locationHint = vaultRefLocation.value.trim()
  if (!label || !locationHint) {
    vaultRefError.value = t('assets.vaultRefFieldsRequired')
    return
  }
  vaultRefLoading.value = true
  try {
    await $fetch('/api/vault-references', {
      method: 'POST',
      body: {
        assetId: assetId.value,
        projectId: primaryProjectId.value ?? undefined,
        label,
        locationHint,
        itemUrl: vaultRefItemUrl.value.trim() || undefined,
      },
    })
    vaultRefLabel.value = ''
    vaultRefLocation.value = ''
    vaultRefItemUrl.value = ''
    await refresh()
  } catch (e: unknown) {
    vaultRefError.value = formatApiError(e)
  } finally {
    vaultRefLoading.value = false
  }
}

async function removeConfigEntry(id: string) {
  configError.value = ''
  try {
    await $fetch(`/api/config-entries/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: unknown) {
    configError.value = formatApiError(e)
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="space-y-2">
        <h1 class="page-title">{{ data?.asset?.name ?? '…' }}</h1>
        <p v-if="data?.asset" class="text-sm text-muted">
          <AssetTypeLabel
            :type="data.asset.type"
            :provider-slug="data.provider?.slug"
            show-description
          />
        </p>
        <p v-if="typeDescription" class="max-w-2xl text-sm text-subtle">{{ typeDescription }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <FavoriteStarButton
          v-if="data?.asset"
          target-type="asset"
          :target-id="assetId"
        />
        <NuxtLink to="/assets" class="btn-secondary">
          {{ t('assets.backToInventory') }}
        </NuxtLink>
        <NuxtLink
          v-if="primaryProjectId"
          :to="`/projects/${primaryProjectId}`"
          class="btn-secondary"
        >
          {{ t('assets.backToProject') }}
        </NuxtLink>
      </div>
    </div>

    <p v-if="pending" class="text-muted">{{ t('common.loading') }}</p>

    <AppCallout
      v-else-if="data?.asset && needsConfirmation"
      :title="t('assets.verificationCalloutTitle')"
      variant="warning"
    >
      {{ t('assets.verificationCalloutBody') }}
      <template #actions>
        <NuxtLink :to="{ query: { ...route.query, tab: 'verifications' } }" class="btn-primary text-sm">
          {{ t('assets.verificationCalloutCta') }}
        </NuxtLink>
        <NuxtLink to="/assets?verification=needs_confirmation" class="btn-secondary text-sm">
          {{ t('assets.openVerificationQueue') }}
        </NuxtLink>
      </template>
    </AppCallout>

    <AppDetailTabs v-if="!pending && data?.asset" :tabs="assetTabs" default-tab="overview">
      <template #overview>
      <section class="card p-6">
        <h2 class="sr-only">{{ t('assets.sectionMetadata') }}</h2>
        <form class="form-grid mt-2" @submit.prevent="saveMetadata">
          <label class="form-field sm:col-span-2">
            <span class="label">{{ t('assets.name') }}</span>
            <input v-model="name" required class="field" />
          </label>
          <label class="form-field">
            <span class="label">{{ t('assets.type') }}</span>
            <select v-model="type" class="field">
              <option v-for="ty in assetTypeOptions" :key="ty" :value="ty">{{ t(`assets.types.${ty}`) }}</option>
              <option
                v-if="!assetTypeOptions.includes(type as (typeof assetTypeOptions)[number])"
                :value="type"
              >
                {{ t(`assets.types.${type}`, type) }}
              </option>
            </select>
            <p v-if="typeDescription" class="mt-1 text-xs text-subtle">{{ typeDescription }}</p>
          </label>
          <label class="form-field">
            <span class="label">{{ t('assets.criticality') }}</span>
            <select v-model="criticality" class="field">
              <option v-for="c in CRITICALITY" :key="c" :value="c">{{ t(`assets.criticalityLevels.${c}`) }}</option>
            </select>
          </label>
          <label class="form-field">
            <span class="label">{{ t('assets.provider') }}</span>
            <select v-model="providerId" class="field">
              <option value="">{{ t('accounts.noProvider') }}</option>
              <option v-for="p in providers?.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </label>
          <label class="form-field sm:col-span-2">
            <span class="label">{{ t('assets.providerAccount') }}</span>
            <p class="mt-0.5 text-xs text-subtle">{{ t('assets.providerAccountHint') }}</p>
            <select v-model="providerAccountId" class="field mt-1">
              <option value="">{{ t('assets.providerAccountAny') }}</option>
              <option v-for="a in filteredProviderAccounts" :key="a.id" :value="a.id">
                {{ a.label }}{{ a.providerName ? ` (${a.providerName})` : '' }}
              </option>
            </select>
            <NuxtLink to="/accounts?tab=providerAccounts" class="mt-1.5 inline-block text-xs text-subtle underline">
              {{ t('assets.providerAccountManage') }}
            </NuxtLink>
          </label>
          <label class="form-field sm:col-span-2">
            <span class="label">{{ t('assets.description') }}</span>
            <textarea v-model="description" rows="3" class="field" />
          </label>
          <label v-if="showAdminUrl" class="form-field">
            <span class="label">{{ t('assets.adminUrl') }}</span>
            <input v-model="adminUrl" type="url" class="field" inputmode="url" />
          </label>
          <label v-if="showPublicUrl" class="form-field">
            <span class="label">{{ t('assets.publicUrl') }}</span>
            <input v-model="publicUrl" type="url" class="field" inputmode="url" />
          </label>

          <div class="form-section sm:col-span-2">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="text-sm font-medium text-ink">{{ t('assets.verificationStatusLabel') }}</p>
                <p class="text-xs text-muted">{{ t('assets.verificationStatusHint') }}</p>
              </div>
              <VerificationGuideLink inline />
            </div>
            <label class="form-field mt-4 max-w-md">
              <span class="sr-only">{{ t('assets.verificationStatusLabel') }}</span>
              <select v-model="verificationStatus" class="field">
                <option v-for="s in VERIFICATION_STATUS_KEYS" :key="s" :value="s">
                  {{ t(`verification.${s}`) }}
                </option>
              </select>
            </label>
            <p
              v-if="verificationStatus === 'confirmed_by_human'"
              class="mt-3 text-xs text-muted"
            >
              {{ t('assets.verificationConfirmedHint') }}
            </p>
            <p class="mt-3 flex flex-wrap items-center gap-2 text-xs text-subtle">
              <span>{{ t('assets.status') }}: {{ t(`assets.statuses.${data.asset.status}`) }}</span>
              <VerificationChip :status="data.asset.verificationStatus" />
            </p>
          </div>
          <p v-if="saveError" class="error-text sm:col-span-2">{{ saveError }}</p>
          <button
            type="submit"
            class="btn-primary sm:col-span-2 sm:w-fit"
            :disabled="saving"
          >
            {{ t('assets.saveChanges') }}
          </button>
        </form>

        <div
          v-if="showVaultLinkField"
          class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule-light pt-6"
        >
          <div>
            <p class="text-sm font-medium text-ink">{{ t('assets.passwordManagerItemUrl') }}</p>
            <p class="text-xs text-subtle">{{ t('assets.passwordManagerItemUrlHint') }}</p>
          </div>
          <AssetVaultLinkControl
            v-model="passwordManagerItemUrl"
            hint-key="assets.passwordManagerItemUrlHint"
            @save="saveAssetVaultLink"
          />
        </div>
      </section>

      <AssetTypeFieldsPanel
        :asset-type="type"
        :attributes="assetAttributes"
        :project-website-url="primaryProjectWebsite"
        @save="saveTypeAttributes"
      />

      <section
        v-if="data.projects?.length"
        class="card mt-6 bg-stone-50/80 dark:bg-stone-900/80 dark:bg-stone-900/80 p-6"
      >
        <h2 class="text-sm font-medium text-ink-secondary">{{ t('assets.projectsLinked') }}</h2>
        <ul class="mt-3 space-y-3 text-sm">
          <li v-for="p in data.projects" :key="p.projectId" class="space-y-1">
            <NuxtLink :to="`/projects/${p.projectId}`" class="font-medium text-ink underline">
              {{ p.projectName }}
            </NuxtLink>
            <label
              v-if="p.projectId === primaryProjectId && projectGraphPack?.environments?.length"
              class="block max-w-sm text-xs"
            >
              <span class="font-medium text-subtle">{{ t('assets.environment') }}</span>
              <select
                class="field mt-1"
                :value="p.environmentId ?? ''"
                :disabled="envLinkSaving"
                @change="setProjectEnvironment(p.projectId, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">{{ t('assets.environmentAny') }}</option>
                <option v-for="env in projectGraphPack.environments" :key="env.id" :value="env.id">
                  {{ env.name }} ({{ t(`projects.envKinds.${env.kind}`) }})
                </option>
              </select>
            </label>
            <p v-else-if="p.environmentName" class="text-muted">
              {{ t('assets.environment') }}: {{ p.environmentName }}
            </p>
          </li>
        </ul>
      </section>
      </template>

      <template #access>
      <section class="card space-y-8 p-6">
        <h2 class="sr-only">{{ t('assets.sectionAccess') }}</h2>

        <div class="space-y-3">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-sm font-semibold text-ink">{{ t('assets.sectionIdentityRoles') }}</h3>
            <p class="text-xs text-subtle">{{ t('assets.sectionIdentityRolesHint') }}</p>
          </div>
          <ul v-if="data.roles?.length" class="list-card text-sm">
            <li v-for="role in data.roles" :key="role.id" class="space-y-1.5 px-3 py-3">
              <div class="flex justify-between gap-2">
                <span class="min-w-0">
                  <NuxtLink
                    v-if="role.identityId"
                    :to="`/identities/${role.identityId}`"
                    class="font-medium text-ink underline decoration-stone-300 underline-offset-2 hover:decoration-stone-600 dark:decoration-stone-600"
                  >
                    {{ role.identityLabel ?? t('assets.unknown') }}
                  </NuxtLink>
                  <span v-else class="font-medium text-ink">{{ role.identityLabel ?? t('assets.unknown') }}</span>
                  <span class="text-subtle"> · {{ t(`assets.roles.${role.roleType}`) }}</span>
                </span>
                <VerificationChip :status="role.verificationStatus" />
              </div>
              <ul
                v-if="role.identityEmails?.length"
                class="space-y-0.5 border-l-2 border-rule-light pl-3 text-xs text-muted"
              >
                <li v-for="(em, idx) in role.identityEmails" :key="`${em.address}-${idx}`">
                  <span class="font-mono text-stone-800 dark:text-stone-200">{{ em.address }}</span>
                  <span class="text-subtle"> · {{ t(`assets.purposes.${em.purpose}`, em.purpose) }}</span>
                  <span
                    v-if="emailAlreadyOnAsset(em.address)"
                    class="ml-1 font-medium text-emerald-800 dark:text-emerald-300"
                  >
                    · {{ t('assets.identityEmailAlreadyOnAsset') }}
                  </span>
                </li>
              </ul>
              <p v-else-if="role.identityId" class="border-l-2 border-rule-light pl-3 text-xs text-subtle">
                {{ t('assets.identityNoEmailsYet') }}
              </p>
            </li>
          </ul>
          <p v-else class="text-sm text-subtle">{{ t('assets.noRoles') }}</p>

          <div class="border-t border-rule-light pt-4">
            <p class="text-sm font-medium text-ink">{{ t('assets.addRole') }}</p>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div
                v-if="!identities?.identities?.length"
                class="callout callout-warning text-sm sm:col-span-2"
              >
                <p class="callout-body">
                  {{ t('assets.accessNoIdentities') }}
                  <NuxtLink to="/accounts?tab=identities" class="font-medium text-ink underline">
                    {{ t('assets.accessCreateIdentity') }}
                  </NuxtLink>
                </p>
              </div>
              <label class="block text-sm sm:col-span-2">
                <span class="label">{{ t('assets.accessIdentity') }}</span>
                <select
                  v-model="newRoleIdentityId"
                  class="field mt-1.5"
                  :disabled="!identities?.identities?.length"
                >
                  <option value="">{{ t('assets.accessIdentityPick') }}</option>
                  <option v-for="ident in identities?.identities" :key="ident.id" :value="ident.id">
                    {{ ident.label }}
                  </option>
                </select>
              </label>
              <label class="block text-sm">
                <span class="label">{{ t('assets.accessRole') }}</span>
                <select v-model="newRoleType" class="field mt-1.5">
                  <option v-for="role in ACCESS_ROLES" :key="role" :value="role">{{ t(`assets.roles.${role}`) }}</option>
                </select>
              </label>
              <div class="flex items-end">
                <button
                  type="button"
                  class="btn-secondary"
                  :disabled="!identities?.identities?.length"
                  @click="addRole"
                >
                  {{ t('assets.addRole') }}
                </button>
              </div>
            </div>
            <p v-if="accessWarning" class="mt-3 text-sm text-amber-800 dark:text-amber-300">{{ accessWarning }}</p>
            <p v-if="accessSuccess" class="mt-3 text-sm text-emerald-800 dark:text-emerald-300">{{ accessSuccess }}</p>
            <p v-if="accessError" class="error-text mt-2">{{ accessError }}</p>
          </div>
        </div>

        <div class="space-y-3 border-t border-rule-light pt-8">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-sm font-semibold text-ink">{{ t('assets.sectionLoginEmails') }}</h3>
            <p class="text-xs text-subtle">{{ t('assets.sectionLoginEmailsHint') }}</p>
          </div>
          <ul v-if="data.emails?.length" class="list-card text-sm">
            <li v-for="em in data.emails" :key="em.id" class="flex items-center justify-between gap-3 px-3 py-2.5">
              <div class="min-w-0">
                <span class="font-medium text-ink">{{ em.address }}</span>
                <span class="text-subtle"> · {{ t(`assets.purposes.${em.purpose}`) }}</span>
              </div>
              <AssetVaultLinkControl
                v-model="emailPmUrls[em.id]"
                hint-key="assets.vaultLinkPerAccessHint"
                @save="saveEmailVaultLink(em.id)"
              />
            </li>
          </ul>
          <p v-else class="text-sm text-subtle">{{ t('assets.noEmails') }}</p>

          <div class="border-t border-rule-light pt-4 space-y-3">
            <p class="text-sm font-medium text-ink">{{ t('assets.linkLoginEmail') }}</p>
            <p class="text-xs leading-relaxed text-muted">
              {{ t('assets.linkLoginEmailIdentitySuggest') }}
              <NuxtLink to="/accounts?tab=identities" class="font-medium text-ink underline">
                {{ t('assets.accessCreateIdentity') }}
              </NuxtLink>
            </p>
            <p v-if="newRoleIdentityId" class="text-xs text-subtle">
              {{ t('assets.linkLoginEmailTieIdentityHint') }}
            </p>
            <div
              v-if="newRoleIdentityId && pickerIdentityEmails.length"
              class="callout callout-neutral text-sm"
            >
              <p class="callout-body">
                <span class="font-medium text-ink">{{ t('assets.pickerIdentityEmailsTitle') }}</span>
              </p>
              <ul class="mt-2 space-y-1 text-xs">
                <li v-for="(em, idx) in pickerIdentityEmails" :key="`pick-${em.address}-${idx}`">
                  <span class="font-mono">{{ em.address }}</span>
                  <span
                    v-if="emailAlreadyOnAsset(em.address)"
                    class="ml-1 font-medium text-emerald-800 dark:text-emerald-300"
                  >
                    {{ t('assets.identityEmailAlreadyOnAsset') }}
                  </span>
                  <span v-else class="ml-1 text-subtle">{{ t('assets.identityEmailNotOnAssetYet') }}</span>
                </li>
              </ul>
            </div>
            <LoginEmailLinkPanel
              class="mt-2"
              mode="asset"
              :asset-id="assetId"
              :tie-identity-id="newRoleIdentityId || null"
              :linked-on-asset-addresses="[...assetLinkedEmailAddresses]"
              @linked="onLoginEmailLinked"
            />
          </div>
        </div>
      </section>
      </template>

      <template #dependencies>
      <AssetDependenciesPanel
        v-if="data.dependencies && data.asset"
        :asset-id="data.asset.id"
        :asset-name="data.asset.name"
        :outbound="data.dependencies.outbound"
        :inbound="data.dependencies.inbound"
        :removing-id="depRemovingId"
        @remove="removeDependency"
      >
        <template #add>
          <InfrastructureQuickLink
            embedded
            :asset-id="assetId"
            :asset-type="type"
            :project-asset-options="projectAssetOptions"
            @linked="onDependencyLinked"
          />
        </template>
      </AssetDependenciesPanel>
      </template>

      <template #config>
      <div class="space-y-6">
        <p class="text-sm text-muted">
          {{ t('assets.configPageLead') }}
          <NuxtLink
            :to="{ path: route.path, query: { tab: 'access' } }"
            class="font-medium text-ink underline decoration-stone-300 underline-offset-2 hover:decoration-stone-600"
          >
            {{ t('assets.configVaultIntroAccessLink') }}
          </NuxtLink>
        </p>

        <section class="card space-y-8 p-6">
          <div class="space-y-4">
            <header class="space-y-1">
              <h2 class="section-title">{{ t('assets.sectionVaultRefs') }}</h2>
              <p class="lede">{{ t('assets.vaultRefsHint') }}</p>
            </header>
            <ul v-if="data.vaultReferences?.length" class="list-card text-sm">
              <li v-for="vr in data.vaultReferences" :key="vr.id" class="space-y-1 px-3 py-3">
                <span class="font-medium text-ink">{{ vr.label }}</span>
                <span class="block text-sm text-muted">{{ vr.locationHint }}</span>
                <a
                  v-if="vr.itemUrl"
                  :href="vr.itemUrl"
                  class="block break-all font-mono text-xs text-subtle underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ vr.itemUrl }}
                </a>
                <p v-if="vr.notes" class="text-xs text-subtle">{{ vr.notes }}</p>
              </li>
            </ul>
            <p v-else class="text-sm text-subtle">{{ t('assets.vaultRefsEmpty') }}</p>
            <form class="grid max-w-2xl gap-4 border-t border-rule-light pt-6 sm:grid-cols-2" @submit.prevent="addVaultReference">
              <label class="block text-sm sm:col-span-2">
                <span class="label">{{ t('assets.vaultRefLabel') }}</span>
                <input v-model="vaultRefLabel" class="field mt-1.5" :placeholder="t('assets.vaultRefLabelPlaceholder')" />
              </label>
              <label class="block text-sm sm:col-span-2">
                <span class="label">{{ t('assets.vaultRefLocation') }}</span>
                <input v-model="vaultRefLocation" class="field mt-1.5" :placeholder="t('assets.vaultRefLocationPlaceholder')" />
              </label>
              <label class="block text-sm sm:col-span-2">
                <span class="label">{{ t('assets.vaultRefItemUrl') }}</span>
                <span class="mt-0.5 block text-xs text-subtle">{{ t('assets.vaultRefItemUrlHint') }}</span>
                <input v-model="vaultRefItemUrl" type="url" class="field mt-1.5 font-mono text-sm" inputmode="url" />
              </label>
              <div class="sm:col-span-2">
                <p v-if="vaultRefError" class="error-text">{{ vaultRefError }}</p>
                <button type="submit" class="btn-secondary mt-2" :disabled="vaultRefLoading">
                  {{ t('assets.addVaultReference') }}
                </button>
              </div>
            </form>
          </div>

          <div class="space-y-4 border-t border-rule-light pt-8">
            <header class="space-y-1">
              <h2 class="section-title">{{ t('assets.sectionConfig') }}</h2>
              <p class="lede">{{ t('assets.configHint') }}</p>
            </header>
        <ul v-if="data.configEntries?.length" class="list-card text-sm">
          <li
            v-for="entry in data.configEntries"
            :key="entry.id"
            class="flex flex-wrap items-start justify-between gap-2 px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <span class="font-medium text-ink">{{ configKeyLabel(entry.key) }}</span>
              <span v-if="entry.description" class="mt-0.5 block text-subtle">{{ entry.description }}</span>
              <p v-if="entry.isSensitiveReference" class="mt-1 text-muted">{{ t('assets.configSensitiveRef') }}</p>
              <p v-else-if="entry.publicValue" class="mt-1 break-all font-mono text-xs text-stone-800 dark:text-stone-200">
                {{ entry.publicValue }}
              </p>
              <p v-else class="mt-1 text-subtle">{{ t('assets.configNoPublicValue') }}</p>
            </div>
            <button type="button" class="text-xs text-red-700 underline" @click="removeConfigEntry(entry.id)">
              {{ t('assets.removeConfigEntry') }}
            </button>
          </li>
        </ul>
        <p v-else class="text-sm text-subtle">{{ t('assets.noConfigEntries') }}</p>
        <form class="max-w-2xl space-y-4 border-t border-rule-light pt-6" @submit.prevent="addConfigEntry">
          <label class="block text-sm">
            <span class="label">{{ t('assets.configKey') }}</span>
            <select v-model="configPreset" class="field mt-1.5">
              <option v-for="preset in CONFIG_ENTRY_KEY_PRESETS" :key="preset" :value="preset">
                {{ t(`assets.configKeys.${preset}`) }}
              </option>
            </select>
          </label>
          <label v-if="configPreset === 'custom'" class="block text-sm">
            <span class="label">{{ t('assets.configCustomKey') }}</span>
            <input v-model="configCustomKey" class="field mt-1.5" required />
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="configSensitive" type="checkbox" class="checkbox" />
            <span>{{ t('assets.configSensitiveToggle') }}</span>
          </label>
          <label v-if="!configSensitive" class="block text-sm">
            <span class="label">{{ t('assets.configPublicValue') }}</span>
            <input v-model="configPublicValue" class="field mt-1.5 font-mono text-sm" />
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assets.configDescription') }}</span>
            <input v-model="configDescription" class="field mt-1.5" />
          </label>
          <p v-if="configError" class="error-text">{{ configError }}</p>
          <button type="submit" class="btn-secondary" :disabled="configLoading">
            {{ t('assets.addConfigEntry') }}
          </button>
        </form>
          </div>
        </section>
      </div>
      </template>

      <template #verifications>
      <section class="card p-6">
        <h2 class="sr-only">{{ t('assets.sectionVerifications') }}</h2>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="max-w-2xl space-y-2">
            <p class="lede">{{ t('assets.verificationsHint') }}</p>
            <VerificationGuideLink />
          </div>
          <VerificationChip :status="data.asset.verificationStatus" />
        </div>
        <div
          v-if="needsConfirmation"
          class="mt-4 rounded-lg border border-rule bg-surface-muted p-4"
        >
          <p class="text-sm font-medium text-ink">{{ t('assets.confirmControlTitle') }}</p>
          <p class="mt-1 text-xs text-muted">{{ t('assets.confirmControlHint') }}</p>
          <button
            type="button"
            class="btn-primary mt-3"
            :disabled="verifyLoading"
            @click="confirmControlQuick"
          >
            {{ t('assets.confirmControl') }}
          </button>
        </div>
        <ul v-if="data.verifications?.length" class="list-card mt-4 text-sm">
          <li v-for="v in data.verifications" :key="v.id" class="space-y-1 px-3 py-2">
            <span class="font-medium text-ink">{{ verificationMethodLabel(v.status) }}</span>
            <p v-if="v.assigneeName" class="text-xs text-muted">
              {{ t('assignee.label') }}: {{ v.assigneeName }}
            </p>
            <p v-if="v.evidenceNote" class="text-muted">{{ v.evidenceNote }}</p>
            <p v-if="v.checkedAt" class="text-xs text-subtle">
              {{ t('assets.verificationChecked', { date: new Date(v.checkedAt).toLocaleDateString() }) }}
            </p>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-subtle">{{ t('assets.noVerifications') }}</p>
        <form class="mt-6 max-w-lg space-y-3" @submit.prevent="addVerification">
          <label class="block text-sm">
            <span class="label">{{ t('assets.verificationMethod') }}</span>
            <select v-model="verifyMethod" class="field mt-1.5">
              <option v-for="m in verificationMethods" :key="m" :value="m">
                {{ t(`verificationMethods.${m}`) }}
              </option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assets.verificationEvidence') }}</span>
            <textarea v-model="verifyNote" rows="2" class="field mt-1.5" :placeholder="t('assets.verificationEvidencePlaceholder')" />
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assignee.label') }}</span>
            <WorkspaceMemberSelect v-model="verifyAssigneeUserId" />
          </label>
          <p v-if="verifyError" class="error-text">{{ verifyError }}</p>
          <button type="submit" class="btn-secondary" :disabled="verifyLoading">
            {{ t('assets.addVerification') }}
          </button>
        </form>
      </section>
      </template>

      <template #map>
      <section
        v-if="primaryProjectId && projectGraphEdges.length"
        class="space-y-4"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="sr-only">{{ t('graph.title') }}</h2>
          <NuxtLink
            :to="`/projects/${primaryProjectId}?tab=graph`"
            class="text-sm text-muted underline hover:text-ink"
          >
            {{ t('graph.openProjectMap') }}
          </NuxtLink>
        </div>
        <ClientOnly>
          <DependencyGraph
            v-if="projectGraphStorageKey"
            compact
            :nodes="projectGraphNodes"
            :edges="projectGraphEdges"
            :highlight-id="assetId"
            :storage-key="projectGraphStorageKey"
          />
        </ClientOnly>
      </section>
      </template>

      <template #actions>
        <ActionsPanel
          :list-url="`/api/assets/${assetId}/actions`"
          :fixed-asset-id="assetId"
          :asset-snippet="data?.asset ? {
            name: data.asset.name,
            adminUrl: data.asset.adminUrl,
            publicUrl: data.asset.publicUrl,
            attributesJson: data.asset.attributesJson,
          } : undefined"
        />
      </template>

      <template #impact>
      <ImpactExplorer
        :asset-options="impactAssets"
        :identity-options="impactIdentities"
        initial-mode="asset"
        :initial-entity-id="assetId"
        :auto-run="true"
      />
      </template>
    </AppDetailTabs>
  </div>
</template>
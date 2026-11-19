<script setup lang="ts">
import { ASSET_TYPE_KEYS, CONFIG_ENTRY_KEY_PRESETS, VERIFICATION_METHOD_KEYS } from '~/constants/inventory'

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
const saveError = ref('')
const saving = ref(false)

const newLoginEmail = ref('')
const newRoleIdentityId = ref('')
const newRoleType = ref<(typeof ACCESS_ROLES)[number]>('admin')
const accessError = ref('')
const verifyMethod = ref<(typeof verificationMethods)[number]>('dns_txt')
const verifyNote = ref('')
const verifyError = ref('')
const verifyLoading = ref(false)

const configPreset = ref<(typeof CONFIG_ENTRY_KEY_PRESETS)[number]>('oauth_client_id')
const configCustomKey = ref('')
const configPublicValue = ref('')
const configDescription = ref('')
const configValueType = ref<'string' | 'url' | 'boolean'>('string')
const configSensitive = ref(false)
const configError = ref('')
const configLoading = ref(false)
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
  },
  { immediate: true },
)

const primaryProjectId = computed(() => data.value?.projects?.[0]?.projectId)

const projectGraphUrl = computed(() =>
  primaryProjectId.value ? `/api/projects/${primaryProjectId.value}` : null,
)
const { data: projectGraphPack } = await useFetch(projectGraphUrl, { watch: [projectGraphUrl] })

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

const assetTabs = computed(() => [
  { id: 'overview', label: t('tabs.assets.overview') },
  { id: 'access', label: t('tabs.assets.access') },
  { id: 'dependencies', label: t('tabs.assets.dependencies') },
  { id: 'config', label: t('tabs.assets.config') },
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
    await $fetch(`/api/assets/${assetId.value}`, {
      method: 'PATCH',
      body: {
        name: name.value,
        type: type.value,
        description: description.value || null,
        adminUrl: adminUrl.value || '',
        publicUrl: publicUrl.value || '',
        providerId: providerId.value || null,
        providerAccountId: providerAccountId.value || null,
        criticality: criticality.value,
      },
    })
    await refresh()
  } catch (e: unknown) {
    saveError.value = formatApiError(e)
  } finally {
    saving.value = false
  }
}

async function linkEmail() {
  accessError.value = ''
  if (!newLoginEmail.value.trim()) return
  try {
    await $fetch('/api/asset-emails', {
      method: 'POST',
      body: {
        assetId: assetId.value,
        address: newLoginEmail.value.trim(),
        purpose: 'login',
        identityId: newRoleIdentityId.value || null,
      },
    })
    newLoginEmail.value = ''
    await refresh()
  } catch (e: unknown) {
    accessError.value = formatApiError(e)
  }
}

async function addRole() {
  accessError.value = ''
  if (!newRoleIdentityId.value) return
  try {
    await $fetch('/api/asset-roles', {
      method: 'POST',
      body: {
        assetId: assetId.value,
        identityId: newRoleIdentityId.value,
        roleType: newRoleType.value,
      },
    })
    await refresh()
  } catch (e: unknown) {
    accessError.value = formatApiError(e)
  }
}

async function addVerification() {
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

async function removeDependency(dependencyId: string) {
  depRemovingId.value = dependencyId
  try {
    await $fetch(`/api/dependencies/${dependencyId}`, { method: 'DELETE' })
    await refresh()
  } finally {
    depRemovingId.value = null
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
        <p v-if="data?.asset" class="text-sm text-stone-600">
          <AssetTypeLabel
            :type="data.asset.type"
            :provider-slug="data.provider?.slug"
            show-description
          />
        </p>
        <p v-if="typeDescription" class="max-w-2xl text-sm text-stone-500">{{ typeDescription }}</p>
      </div>
      <div class="flex flex-wrap gap-2 text-sm">
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

    <p v-if="pending" class="text-stone-600">{{ t('common.loading') }}</p>

    <AppDetailTabs v-else-if="data?.asset" :tabs="assetTabs" default-tab="overview">
      <template #overview>
      <section class="card p-6">
        <h2 class="sr-only">{{ t('assets.sectionMetadata') }}</h2>
        <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="saveMetadata">
          <label class="block text-sm sm:col-span-2">
            <span class="label">{{ t('assets.name') }}</span>
            <input v-model="name" required class="field mt-1.5" />
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assets.type') }}</span>
            <select v-model="type" class="field mt-1.5">
              <option v-for="ty in assetTypeOptions" :key="ty" :value="ty">{{ t(`assets.types.${ty}`) }}</option>
              <option
                v-if="!assetTypeOptions.includes(type as (typeof assetTypeOptions)[number])"
                :value="type"
              >
                {{ t(`assets.types.${type}`, type) }}
              </option>
            </select>
            <p v-if="typeDescription" class="mt-1 text-xs text-stone-500">{{ typeDescription }}</p>
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assets.criticality') }}</span>
            <select v-model="criticality" class="field mt-1.5">
              <option v-for="c in CRITICALITY" :key="c" :value="c">{{ t(`assets.criticalityLevels.${c}`) }}</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assets.provider') }}</span>
            <select v-model="providerId" class="field mt-1.5">
              <option value="">{{ t('accounts.noProvider') }}</option>
              <option v-for="p in providers?.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assets.providerAccount') }}</span>
            <select v-model="providerAccountId" class="field mt-1.5">
              <option value="">{{ t('assets.providerAccountAny') }}</option>
              <option v-for="a in accounts?.accounts" :key="a.id" :value="a.id">{{ a.label }}</option>
            </select>
          </label>
          <label class="block text-sm sm:col-span-2">
            <span class="label">{{ t('assets.description') }}</span>
            <textarea v-model="description" rows="3" class="field mt-1.5" />
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assets.adminUrl') }}</span>
            <input v-model="adminUrl" type="url" class="field mt-1.5" />
          </label>
          <label class="block text-sm">
            <span class="label">{{ t('assets.publicUrl', 'Public URL') }}</span>
            <input v-model="publicUrl" type="url" class="field mt-1.5" />
          </label>
          <p class="flex flex-wrap items-center gap-2 text-sm text-stone-500 sm:col-span-2">
            <span>{{ t('assets.status') }}: {{ t(`assets.statuses.${data.asset.status}`) }}</span>
            <VerificationChip :status="data.asset.verificationStatus" />
          </p>
          <p v-if="saveError" class="error-text sm:col-span-2">{{ saveError }}</p>
          <button
            type="submit"
            class="btn-primary sm:col-span-2 sm:w-fit"
            :disabled="saving"
          >
            {{ t('assets.saveChanges') }}
          </button>
        </form>
      </section>

      <section
        v-if="data.projects?.length"
        class="card mt-6 bg-stone-50/80 p-6"
      >
        <h2 class="text-sm font-medium text-stone-700">{{ t('assets.projectsLinked') }}</h2>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="p in data.projects" :key="p.projectId">
            <NuxtLink :to="`/projects/${p.projectId}`" class="font-medium underline">{{ p.projectName }}</NuxtLink>
            <span v-if="p.environmentName" class="text-stone-500"> · {{ p.environmentName }}</span>
          </li>
        </ul>
      </section>
      </template>

      <template #access>
      <section class="card p-6">
        <h2 class="sr-only">{{ t('assets.sectionAccess') }}</h2>

        <ul v-if="data.roles?.length" class="list-card mt-3 text-sm">
          <li v-for="role in data.roles" :key="role.id" class="flex justify-between gap-2 px-3 py-2">
            <span>
              {{ role.identityLabel ?? t('assets.unknown') }}
              <span class="text-stone-500">({{ t(`assets.roles.${role.roleType}`) }})</span>
            </span>
            <VerificationChip :status="role.verificationStatus" />
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-stone-500">{{ t('assets.noRoles') }}</p>

        <ul v-if="data.emails?.length" class="list-card mt-4 text-sm">
          <li v-for="em in data.emails" :key="em.id" class="px-3 py-2">
            {{ em.address }}
            <span class="text-stone-500">({{ t(`assets.purposes.${em.purpose}`) }})</span>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-stone-500">{{ t('assets.noEmails') }}</p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <label class="block text-sm sm:col-span-2">
            <span class="label">{{ t('assets.accessIdentity') }}</span>
            <select v-model="newRoleIdentityId" class="field mt-1.5">
              <option value="">{{ t('assets.accessIdentityAny') }}</option>
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
              @click="addRole"
            >
              {{ t('assets.addRole') }}
            </button>
          </div>
          <label class="block text-sm sm:col-span-2">
            <span class="label">{{ t('assets.loginEmail') }}</span>
            <input v-model="newLoginEmail" type="email" class="field mt-1.5" />
          </label>
          <button
            type="button"
            class="btn-primary sm:col-span-2 sm:w-fit"
            @click="linkEmail"
          >
            {{ t('assets.linkLoginEmail') }}
          </button>
        </div>
        <p v-if="accessError" class="error-text mt-2">{{ accessError }}</p>
      </section>
      </template>

      <template #dependencies>
      <AssetDependenciesPanel
        v-if="data.dependencies"
        :outbound="data.dependencies.outbound"
        :inbound="data.dependencies.inbound"
        :removing-id="depRemovingId"
        @remove="removeDependency"
      />
      </template>

      <template #config>
      <section v-if="data.vaultReferences?.length" class="card bg-stone-50/80 p-6">
        <h2 class="section-title">{{ t('assets.sectionVaultRefs') }}</h2>
        <p class="lede">{{ t('assets.vaultRefsHint') }}</p>
        <ul class="list-card mt-3 text-sm">
          <li v-for="vr in data.vaultReferences" :key="vr.id" class="px-3 py-2">
            <span class="font-medium">{{ vr.label }}</span>
            <span class="mt-1 block text-stone-600">{{ vr.locationHint }}</span>
            <span v-if="vr.notes" class="text-stone-500">{{ vr.notes }}</span>
          </li>
        </ul>
      </section>

      <section class="card p-6" :class="data.vaultReferences?.length ? 'mt-6' : ''">
        <h2 class="section-title">{{ t('assets.sectionConfig') }}</h2>
        <p class="lede">{{ t('assets.configHint') }}</p>
        <ul v-if="data.configEntries?.length" class="list-card mt-4 text-sm">
          <li
            v-for="entry in data.configEntries"
            :key="entry.id"
            class="flex flex-wrap items-start justify-between gap-2 px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <span class="font-medium text-stone-900">{{ configKeyLabel(entry.key) }}</span>
              <span v-if="entry.description" class="mt-0.5 block text-stone-500">{{ entry.description }}</span>
              <p v-if="entry.isSensitiveReference" class="mt-1 text-stone-600">{{ t('assets.configSensitiveRef') }}</p>
              <p v-else-if="entry.publicValue" class="mt-1 break-all font-mono text-xs text-stone-800">
                {{ entry.publicValue }}
              </p>
              <p v-else class="mt-1 text-stone-500">{{ t('assets.configNoPublicValue') }}</p>
            </div>
            <button type="button" class="text-xs text-red-700 underline" @click="removeConfigEntry(entry.id)">
              {{ t('assets.removeConfigEntry') }}
            </button>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-stone-500">{{ t('assets.noConfigEntries') }}</p>
        <form class="mt-6 max-w-xl space-y-3" @submit.prevent="addConfigEntry">
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
            <input v-model="configSensitive" type="checkbox" class="rounded border-stone-300" />
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
      </section>
      </template>

      <template #verifications>
      <section class="card p-6">
        <h2 class="sr-only">{{ t('assets.sectionVerifications') }}</h2>
        <p class="lede">{{ t('assets.verificationsHint') }}</p>
        <ul v-if="data.verifications?.length" class="list-card mt-4 text-sm">
          <li v-for="v in data.verifications" :key="v.id" class="space-y-1 px-3 py-2">
            <span class="font-medium text-stone-900">{{ verificationMethodLabel(v.status) }}</span>
            <p v-if="v.evidenceNote" class="text-stone-600">{{ v.evidenceNote }}</p>
            <p v-if="v.checkedAt" class="text-xs text-stone-500">
              {{ t('assets.verificationChecked', { date: new Date(v.checkedAt).toLocaleDateString() }) }}
            </p>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-stone-500">{{ t('assets.noVerifications') }}</p>
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
            class="text-sm text-stone-600 underline hover:text-stone-900"
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
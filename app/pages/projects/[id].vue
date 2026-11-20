<script setup lang="ts">
import { ASSET_TYPE_KEYS, ENVIRONMENT_KINDS, RELATION_TYPE_KEYS } from '~/constants/inventory'

const ASSET_TYPES = ASSET_TYPE_KEYS
const ACCESS_ROLES = ['admin', 'operator', 'owner', 'developer', 'viewer', 'other'] as const

const { t } = useI18n()
const route = useRoute()
const id = computed(() => String(route.params.id))
const showSetupChecklist = computed(() => route.query.setup === '1')

const { data, refresh, pending } = await useFetch(() => `/api/projects/${id.value}`, { watch: [id] })
const { data: projectRunbooks } = await useFetch(() => `/api/runbooks?projectId=${id.value}`, { watch: [id] })
const { data: providers } = await useFetch('/api/providers')
const { data: identities } = await useFetch('/api/identities')
const { data: accounts } = await useFetch('/api/provider-accounts')

const showAssetForm = ref(false)
const assetName = ref('')
const assetType = ref<(typeof ASSET_TYPES)[number]>('service')
const assetProviderId = ref('')
const assetAccountId = ref('')
const assetEnvironmentId = ref('')
const assetIdentityId = ref('')
const assetAccessRole = ref<(typeof ACCESS_ROLES)[number]>('admin')
const assetLoginEmail = ref('')
const assetAdminUrl = ref('')
const assetError = ref('')
const assetLoading = ref(false)

const depFrom = ref('')
const depTo = ref('')
const depType = ref<(typeof RELATION_TYPE_KEYS)[number]>('depends_on')
const depRemovingId = ref<string | null>(null)
const depConfirmOpen = ref(false)
const pendingDepId = ref<string | null>(null)

const envName = ref('')
const envKind = ref<(typeof ENVIRONMENT_KINDS)[number]>('development')
const envError = ref('')
const envLoading = ref(false)
const envDeletingId = ref<string | null>(null)
const envConfirmOpen = ref(false)
const pendingEnvId = ref<string | null>(null)
const envAssignLoading = ref<string | null>(null)

const unassignedAssets = computed(() => (data.value?.assets ?? []).filter((a) => !a.environmentId))

function assetsInEnvironment(envId: string) {
  return (data.value?.assets ?? []).filter((a) => a.environmentId === envId)
}

async function assignAssetEnvironment(assetId: string, rawEnvId: string) {
  envAssignLoading.value = assetId
  try {
    await $fetch('/api/project-assets', {
      method: 'PATCH',
      body: {
        projectId: id.value,
        assetId,
        environmentId: rawEnvId || null,
      },
    })
    await refresh()
  } finally {
    envAssignLoading.value = null
  }
}

function resetAssetForm() {
  assetName.value = ''
  assetType.value = 'service'
  assetProviderId.value = ''
  assetAccountId.value = ''
  assetEnvironmentId.value = ''
  assetIdentityId.value = ''
  assetAccessRole.value = 'admin'
  assetLoginEmail.value = ''
  assetAdminUrl.value = ''
  assetError.value = ''
}

async function addDependency() {
  await $fetch('/api/dependencies', {
    method: 'POST',
    body: { fromAssetId: depFrom.value, toAssetId: depTo.value, relationType: depType.value },
  })
  depFrom.value = ''
  depTo.value = ''
  await refresh()
}

function askRemoveDependency(dependencyId: string) {
  pendingDepId.value = dependencyId
  depConfirmOpen.value = true
}

async function confirmRemoveDependency() {
  const dependencyId = pendingDepId.value
  if (!dependencyId) return
  depRemovingId.value = dependencyId
  try {
    await $fetch(`/api/dependencies/${dependencyId}`, { method: 'DELETE' })
    await refresh()
  } finally {
    depRemovingId.value = null
    pendingDepId.value = null
  }
}

async function addEnvironment() {
  envError.value = ''
  envLoading.value = true
  try {
    await $fetch('/api/environments', {
      method: 'POST',
      body: {
        projectId: id.value,
        name: envName.value.trim(),
        kind: envKind.value,
      },
    })
    envName.value = ''
    await refresh()
  } catch (e: unknown) {
    envError.value = formatApiError(e) || t('projects.envCreateError')
  } finally {
    envLoading.value = false
  }
}

function askRemoveEnvironment(environmentId: string) {
  pendingEnvId.value = environmentId
  envConfirmOpen.value = true
}

async function confirmRemoveEnvironment() {
  const environmentId = pendingEnvId.value
  if (!environmentId) return
  envDeletingId.value = environmentId
  envError.value = ''
  try {
    await $fetch(`/api/environments/${environmentId}`, { method: 'DELETE' })
    await refresh()
  } catch (e: unknown) {
    envError.value = formatApiError(e) || t('projects.envDeleteError')
  } finally {
    envDeletingId.value = null
    pendingEnvId.value = null
  }
}

async function createAsset() {
  assetError.value = ''
  assetLoading.value = true
  try {
    await $fetch('/api/assets', {
      method: 'POST',
      body: {
        projectId: id.value,
        name: assetName.value,
        type: assetType.value,
        providerId: assetProviderId.value || null,
        providerAccountId: assetAccountId.value || null,
        environmentId: assetEnvironmentId.value || null,
        identityId: assetIdentityId.value || null,
        accessRoleType: assetIdentityId.value ? assetAccessRole.value : undefined,
        loginEmail: assetLoginEmail.value.trim() || undefined,
        adminUrl: assetAdminUrl.value.trim() || undefined,
      },
    })
    resetAssetForm()
    showAssetForm.value = false
    await refresh()
  } catch (e: unknown) {
    assetError.value = formatApiError(e) || t('assets.createError')
  } finally {
    assetLoading.value = false
  }
}

const graphNodes = computed(() =>
  (data.value?.assets ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    providerSlug: a.providerSlug,
    verificationStatus: a.verificationStatus,
  })),
)

const graphEdges = computed(() =>
  (data.value?.dependencies ?? []).map((d) => ({
    id: d.id,
    from: d.fromAssetId,
    to: d.toAssetId,
    relationType: d.relationType,
    verificationStatus: d.verificationStatus,
  })),
)

const graphStorageKey = computed(() => `dep-graph-${id.value}`)

const assetNameById = computed(() => {
  const m = new Map<string, string>()
  for (const a of data.value?.assets ?? []) m.set(a.id, a.name)
  return m
})

const pendingDepPreview = computed(() => {
  const depId = pendingDepId.value
  if (!depId) return null
  const d = data.value?.dependencies?.find((row) => row.id === depId)
  if (!d) return null
  const names = assetNameById.value
  return {
    fromId: d.fromAssetId,
    fromName: names.get(d.fromAssetId) ?? d.fromAssetId,
    toId: d.toAssetId,
    toName: names.get(d.toAssetId) ?? d.toAssetId,
    relationType: d.relationType,
    verificationStatus: d.verificationStatus,
  }
})

const pendingEnvironment = computed(() => {
  const envId = pendingEnvId.value
  if (!envId) return null
  return data.value?.environments?.find((env) => env.id === envId) ?? null
})

const projectTabs = computed(() => [
  { id: 'assets', label: t('tabs.projects.assets') },
  { id: 'environments', label: t('tabs.projects.environments') },
  {
    id: 'graph',
    label: t('tabs.projects.graph'),
    visible: Boolean(data.value?.assets?.length),
  },
  { id: 'dependencies', label: t('tabs.projects.dependencies') },
  { id: 'runbooks', label: t('tabs.projects.runbooks') },
  { id: 'danger', label: t('tabs.projects.danger') },
])

useAppPageTitle(
  computed(() =>
    data.value?.project?.name
      ? `${data.value.project.name}`
      : t('pageTitles.loading'),
  ),
)

const showDeleteConfirm = ref(false)
const deleteConfirmName = ref('')
const deleteError = ref('')
const deleteLoading = ref(false)

const canDelete = computed(
  () => data.value?.project && deleteConfirmName.value === data.value.project.name,
)

async function deleteProject() {
  if (!canDelete.value) return
  deleteError.value = ''
  deleteLoading.value = true
  try {
    await $fetch(`/api/projects/${id.value}`, { method: 'DELETE' })
    await navigateTo('/projects')
  } catch (e: unknown) {
    deleteError.value = formatApiError(e) || t('projects.deleteError')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div v-if="pending" class="text-muted">{{ t('common.loading') }}</div>
  <div v-else-if="data?.project" class="space-y-8">
    <AppConfirmDialog
      v-model:open="depConfirmOpen"
      :title="t('dependencies.confirmRemoveTitle')"
      :description="t('dependencies.confirmRemoveDescription')"
      :confirm-label="t('dependencies.remove')"
      @confirm="confirmRemoveDependency"
    >
      <div
        v-if="pendingDepPreview"
        class="rounded-lg border border-rule bg-stone-50/90 dark:bg-stone-900/80 dark:bg-stone-900/80 px-3 py-2.5"
      >
        <DependencyListRow v-bind="pendingDepPreview" compact />
      </div>
    </AppConfirmDialog>
    <AppConfirmDialog
      v-model:open="envConfirmOpen"
      :title="t('projects.confirmRemoveEnvironmentTitle')"
      :description="t('projects.confirmRemoveEnvironmentDescription')"
      :confirm-label="t('projects.deleteEnvironment')"
      @confirm="confirmRemoveEnvironment"
    >
      <p
        v-if="pendingEnvironment"
        class="rounded-lg border border-rule bg-stone-50/90 dark:bg-stone-900/80 dark:bg-stone-900/80 px-3 py-2.5 text-sm font-medium text-ink"
      >
        {{ pendingEnvironment.name }}
        <span class="font-normal text-subtle">
          ({{ t(`projects.envKinds.${pendingEnvironment.kind}`) }})
        </span>
      </p>
    </AppConfirmDialog>
    <header class="space-y-1">
      <h1 class="page-title">{{ data.project.name }}</h1>
      <p v-if="data.project.description" class="text-muted">{{ data.project.description }}</p>
      <a
        v-if="data.project.websiteUrl"
        :href="data.project.websiteUrl"
        class="text-sm text-subtle underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ data.project.websiteUrl }}
      </a>
    </header>

    <ProjectSetupChecklist v-if="showSetupChecklist" :project-id="id" />

    <AppDetailTabs :tabs="projectTabs" default-tab="assets">
      <template #assets>
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-4">
        <h2 class="sr-only">{{ t('projects.assetsTitle') }}</h2>
        <button
          type="button"
          class="btn-secondary"
          @click="
            () => {
              if (showAssetForm) resetAssetForm()
              showAssetForm = !showAssetForm
            }
          "
        >
          {{ showAssetForm ? t('common.cancel') : t('assets.add') }}
        </button>
      </div>

      <form
        v-if="showAssetForm"
        class="card space-y-4 p-5"
        @submit.prevent="createAsset"
      >
        <div class="form-grid">
          <label class="block text-sm sm:col-span-2">
            <span class="label">{{ t('assets.name') }}</span>
            <input v-model="assetName" required class="field mt-1.5" />
          </label>

          <label class="block text-sm">
            <span class="label">{{ t('assets.type') }}</span>
            <select v-model="assetType" class="field mt-1.5">
              <option v-for="ty in ASSET_TYPES" :key="ty" :value="ty">
                {{ t(`assets.types.${ty}`) }}
              </option>
            </select>
          </label>

          <label class="block text-sm">
            <span class="label">{{ t('assets.provider') }}</span>
            <select v-model="assetProviderId" class="field mt-1.5">
              <option value="">{{ t('accounts.noProvider') }}</option>
              <option v-for="p in providers?.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </label>

          <label class="block text-sm">
            <span class="label">{{ t('assets.environment') }}</span>
            <select
              v-model="assetEnvironmentId"
              class="field mt-1.5"
            >
              <option value="">{{ t('assets.environmentAny') }}</option>
              <option v-for="env in data.environments" :key="env.id" :value="env.id">
                {{ env.name }} ({{ env.kind }})
              </option>
            </select>
          </label>

          <label class="block text-sm">
            <span class="label">{{ t('assets.providerAccount') }}</span>
            <select v-model="assetAccountId" class="field mt-1.5">
              <option value="">{{ t('assets.providerAccountAny') }}</option>
              <option v-for="a in accounts?.accounts" :key="a.id" :value="a.id">{{ a.label }}</option>
            </select>
          </label>

          <label class="block text-sm">
            <span class="label">{{ t('assets.accessIdentity') }}</span>
            <select
              v-model="assetIdentityId"
              class="field mt-1.5"
            >
              <option value="">{{ t('assets.accessIdentityAny') }}</option>
              <option v-for="ident in identities?.identities" :key="ident.id" :value="ident.id">
                {{ ident.label }}
              </option>
            </select>
          </label>

          <label v-if="assetIdentityId" class="block text-sm">
            <span class="label">{{ t('assets.accessRole') }}</span>
            <select v-model="assetAccessRole" class="field mt-1.5">
              <option v-for="role in ACCESS_ROLES" :key="role" :value="role">{{ t(`assets.roles.${role}`) }}</option>
            </select>
          </label>

          <label class="block text-sm sm:col-span-2">
            <span class="label">{{ t('assets.loginEmail') }}</span>
            <p class="mt-0.5 text-xs text-subtle">{{ t('assets.loginEmailHint') }}</p>
            <input
              v-model="assetLoginEmail"
              type="email"
              autocomplete="off"
              class="field mt-1.5"
            />
          </label>

          <label class="block text-sm sm:col-span-2">
            <span class="label">{{ t('assets.adminUrl') }}</span>
            <input
              v-model="assetAdminUrl"
              type="url"
              placeholder="https://"
              class="field mt-1.5"
            />
          </label>
        </div>

        <p v-if="assetError" class="error-text">{{ assetError }}</p>
        <button type="submit" class="btn-primary" :disabled="assetLoading">
          {{ assetLoading ? t('common.loading') : t('assets.create') }}
        </button>
      </form>

      <ul v-if="data.assets?.length" class="list-card">
        <li v-for="asset in data.assets" :key="asset.id" class="px-4 py-4 space-y-2">
          <div class="flex flex-wrap items-baseline gap-2">
            <NuxtLink :to="`/assets/${asset.id}`" class="font-medium text-ink hover:underline">
              {{ asset.name }}
            </NuxtLink>
            <span class="text-sm text-subtle">
              <AssetTypeLabel :type="asset.type" :provider-slug="asset.providerSlug" dense />
            </span>
            <VerificationChip :status="asset.verificationStatus" />
          </div>
          <p v-if="asset.providerName" class="text-sm text-muted">{{ asset.providerName }}</p>
          <label class="mt-2 block max-w-sm text-xs">
            <span class="font-medium text-subtle">{{ t('assets.environment') }}</span>
            <select
              class="field mt-1 text-sm"
              :value="asset.environmentId ?? ''"
              :disabled="envAssignLoading === asset.id"
              @change="assignAssetEnvironment(asset.id, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">{{ t('assets.environmentAny') }}</option>
              <option v-for="env in data.environments" :key="env.id" :value="env.id">
                {{ env.name }} ({{ t(`projects.envKinds.${env.kind}`) }})
              </option>
            </select>
          </label>
          <p v-if="asset.roles?.length" class="text-sm text-muted">
            <span class="font-medium text-subtle">{{ t('assets.linkedIdentities') }}:</span>
            <span v-for="(role, ri) in asset.roles" :key="ri" class="ml-1">
              {{ role.identityLabel ?? t('assets.unknown') }} ({{ t(`assets.roles.${role.roleType}`) }})<span v-if="ri < asset.roles.length - 1">;</span>
            </span>
          </p>
          <p v-if="asset.emails?.length" class="text-sm text-muted">
            <span class="font-medium text-subtle">{{ t('assets.linkedEmails') }}:</span>
            <span v-for="(em, ei) in asset.emails" :key="ei" class="ml-1">
              {{ em.address }} ({{ t(`assets.purposes.${em.purpose}`) }})<span v-if="ei < asset.emails.length - 1">;</span>
            </span>
          </p>
          <a
            v-if="asset.adminUrl"
            :href="asset.adminUrl"
            class="text-sm text-muted underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ asset.adminUrl }}
          </a>
        </li>
      </ul>
      <p v-else class="lede">{{ t('projects.noAssets') }}</p>
    </div>
      </template>

      <template #environments>
        <div class="space-y-4">
          <form class="card flex flex-wrap items-end gap-3 p-5" @submit.prevent="addEnvironment">
            <label class="block min-w-[10rem] flex-1 text-sm">
              <span class="label">{{ t('projects.envName') }}</span>
              <input v-model="envName" required class="field mt-1.5" />
            </label>
            <label class="block min-w-[10rem] text-sm">
              <span class="label">{{ t('projects.envKind') }}</span>
              <select v-model="envKind" class="field mt-1.5">
                <option v-for="kind in ENVIRONMENT_KINDS" :key="kind" :value="kind">
                  {{ t(`projects.envKinds.${kind}`) }}
                </option>
              </select>
            </label>
            <button type="submit" class="btn-secondary" :disabled="envLoading">
              {{ t('projects.addEnvironment') }}
            </button>
          </form>
          <p v-if="envError" class="error-text">{{ envError }}</p>
          <p class="text-sm text-muted">{{ t('projects.environmentsHint') }}</p>
          <ul v-if="data.environments?.length" class="space-y-4">
            <li
              v-for="env in data.environments"
              :key="env.id"
              class="list-card text-sm"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-rule-light px-4 py-3">
                <span>
                  <span class="font-medium text-ink">{{ env.name }}</span>
                  <span class="ml-2 text-subtle">({{ t(`projects.envKinds.${env.kind}`) }})</span>
                  <span class="ml-2 text-xs text-faint">
                    {{ t('projects.envAssetCount', { count: assetsInEnvironment(env.id).length }) }}
                  </span>
                </span>
                <button
                  type="button"
                  class="text-xs font-medium text-red-800 hover:underline"
                  :disabled="envDeletingId === env.id"
                  @click="askRemoveEnvironment(env.id)"
                >
                  {{ t('projects.deleteEnvironment') }}
                </button>
              </div>
              <ul v-if="assetsInEnvironment(env.id).length" class="divide-y divide-rule">
                <li
                  v-for="asset in assetsInEnvironment(env.id)"
                  :key="asset.id"
                  class="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
                >
                  <NuxtLink :to="`/assets/${asset.id}`" class="font-medium text-ink hover:underline">
                    {{ asset.name }}
                  </NuxtLink>
                  <AssetTypeLabel :type="asset.type" :provider-slug="asset.providerSlug" dense />
                </li>
              </ul>
              <p v-else class="px-4 py-3 text-xs text-subtle">{{ t('projects.envNoAssets') }}</p>
            </li>
          </ul>
          <p v-else class="lede">{{ t('projects.noEnvironments') }}</p>
          <section v-if="unassignedAssets.length" class="callout callout-neutral">
            <p class="text-sm font-medium text-stone-800 dark:text-stone-200">{{ t('projects.unassignedAssetsTitle') }}</p>
            <p class="mt-1 text-xs text-muted">{{ t('projects.unassignedAssetsHint') }}</p>
            <ul class="mt-3 space-y-1 text-sm">
              <li v-for="asset in unassignedAssets" :key="asset.id" class="flex flex-wrap items-center gap-2">
                <NuxtLink :to="`/assets/${asset.id}`" class="font-medium underline">{{ asset.name }}</NuxtLink>
                <select
                  class="field max-w-[12rem] py-1 text-xs"
                  @change="assignAssetEnvironment(asset.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">{{ t('projects.assignEnvironment') }}</option>
                  <option v-for="env in data.environments" :key="env.id" :value="env.id">{{ env.name }}</option>
                </select>
              </li>
            </ul>
          </section>
        </div>
      </template>

      <template #graph>
    <div v-if="data.assets?.length" class="space-y-3">
      <h2 class="sr-only">{{ t('graph.title') }}</h2>
      <ClientOnly>
        <DependencyGraph :nodes="graphNodes" :edges="graphEdges" :storage-key="graphStorageKey" />
      </ClientOnly>
    </div>
      </template>

      <template #dependencies>
    <div class="space-y-3">
      <h2 class="sr-only">{{ t('projects.dependencies') }}</h2>
      <form v-if="data.assets?.length" class="flex flex-wrap items-center gap-2" @submit.prevent="addDependency">
        <select v-model="depFrom" required class="field w-auto">
          <option value="">{{ t('projects.depFrom') }}</option>
          <option v-for="a in data.assets" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="depTo" required class="field w-auto">
          <option value="">{{ t('projects.depTo') }}</option>
          <option v-for="a in data.assets" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="depType" class="field w-auto max-w-[14rem]">
          <option v-for="relation in RELATION_TYPE_KEYS" :key="relation" :value="relation">
            {{ t(`dependencies.relationTypes.${relation}`) }}
          </option>
        </select>
        <button type="submit" class="btn-secondary">{{ t('common.add') }}</button>
      </form>
      <ul v-if="data.dependencies?.length" class="list-card text-sm">
        <li v-for="d in data.dependencies" :key="d.id" class="px-4 py-3">
          <DependencyListRow
            :from-id="d.fromAssetId"
            :from-name="assetNameById.get(d.fromAssetId) ?? d.fromAssetId"
            :to-id="d.toAssetId"
            :to-name="assetNameById.get(d.toAssetId) ?? d.toAssetId"
            :relation-type="d.relationType"
            :verification-status="d.verificationStatus"
            :removing="depRemovingId === d.id"
            @remove="askRemoveDependency(d.id)"
          />
        </li>
      </ul>
      <p v-else-if="data.assets?.length" class="lede">{{ t('projects.noDependencies') }}</p>
    </div>
      </template>

      <template #runbooks>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-muted">{{ t('guides.projectTabHint') }}</p>
          <NuxtLink :to="`/guides/templates?projectId=${id}`" class="btn-secondary text-sm">{{ t('guides.templates.browseAll') }}</NuxtLink>
          <NuxtLink :to="`/guides/new?projectId=${id}`" class="btn-primary text-sm">{{ t('guides.newFromTemplate') }}</NuxtLink>
        </div>
        <ul v-if="projectRunbooks?.runbooks?.length" class="mt-4 space-y-2">
          <li v-for="rb in projectRunbooks.runbooks" :key="rb.id">
            <NuxtLink :to="`/guides/${rb.id}`" class="font-medium underline">{{ rb.title }}</NuxtLink>
          </li>
        </ul>
        <p v-else class="mt-4 text-sm text-subtle">{{ t('guides.empty') }}</p>
      </template>

      <template #danger>
        <AppDangerZone :title="t('projects.deleteTitle')" :description="t('projects.deleteHint')">
          <button v-if="!showDeleteConfirm" type="button" class="btn-danger" @click="showDeleteConfirm = true">
            {{ t('projects.deleteProject') }}
          </button>
          <form v-else class="max-w-md space-y-3" @submit.prevent="deleteProject">
            <label class="block text-sm">
              <span class="label">{{ t('projects.deleteConfirmLabel') }}</span>
              <input
                v-model="deleteConfirmName"
                type="text"
                :placeholder="data.project.name"
                class="field mt-1.5"
                autocomplete="off"
              />
            </label>
            <p v-if="deleteError" class="error-text">{{ deleteError }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                type="submit"
                class="btn-danger-primary"
                :disabled="!canDelete || deleteLoading"
              >
                {{ t('projects.deleteConfirmButton') }}
              </button>
              <button
                type="button"
                class="btn-secondary"
                @click="
                  () => {
                    showDeleteConfirm = false
                    deleteConfirmName = ''
                    deleteError = ''
                  }
                "
              >
                {{ t('common.cancel') }}
              </button>
            </div>
          </form>
        </AppDangerZone>
      </template>
    </AppDetailTabs>
  </div>
</template>
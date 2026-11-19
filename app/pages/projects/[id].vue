<script setup lang="ts">
const ASSET_TYPES = ['service', 'domain', 'hosting', 'repository', 'dns', 'email', 'other'] as const
const ACCESS_ROLES = ['admin', 'operator', 'owner', 'developer', 'viewer', 'other'] as const
const RELATION_TYPES = ['depends_on', 'hosted_on', 'deployed_from', 'authenticated_by', 'verified_with', 'stores_data_in'] as const

const { t } = useI18n()
const route = useRoute()
const id = computed(() => String(route.params.id))

const { data, refresh, pending } = await useFetch(() => `/api/projects/${id.value}`, { watch: [id] })
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
const depType = ref('depends_on')

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
  <div v-if="pending" class="text-stone-600">{{ t('common.loading') }}</div>
  <div v-else-if="data?.project" class="space-y-8">
    <header class="space-y-1">
      <h1 class="page-title">{{ data.project.name }}</h1>
      <p v-if="data.project.description" class="text-stone-600">{{ data.project.description }}</p>
      <a
        v-if="data.project.websiteUrl"
        :href="data.project.websiteUrl"
        class="text-sm text-stone-500 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ data.project.websiteUrl }}
      </a>
    </header>

    <section class="space-y-3">
      <div class="flex items-center justify-between gap-4">
        <h2 class="section-title">{{ t('projects.assetsTitle') }}</h2>
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
        <div class="grid gap-4 sm:grid-cols-2">
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
            <p class="mt-0.5 text-xs text-stone-500">{{ t('assets.loginEmailHint') }}</p>
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
            <NuxtLink :to="`/assets/${asset.id}`" class="font-medium text-stone-900 hover:underline">
              {{ asset.name }}
            </NuxtLink>
            <span class="text-sm text-stone-500">
              <AssetTypeLabel :type="asset.type" :provider-slug="asset.providerSlug" />
            </span>
            <VerificationChip :status="asset.verificationStatus" />
          </div>
          <p class="text-sm text-stone-600">
            <span v-if="asset.providerName">{{ asset.providerName }}</span>
            <span v-if="asset.environmentName" class="ml-2">· {{ asset.environmentName }}</span>
          </p>
          <p v-if="asset.roles?.length" class="text-sm text-stone-600">
            <span class="font-medium text-stone-500">{{ t('assets.linkedIdentities') }}:</span>
            <span v-for="(role, ri) in asset.roles" :key="ri" class="ml-1">
              {{ role.identityLabel ?? t('assets.unknown') }} ({{ t(`assets.roles.${role.roleType}`) }})<span v-if="ri < asset.roles.length - 1">;</span>
            </span>
          </p>
          <p v-if="asset.emails?.length" class="text-sm text-stone-600">
            <span class="font-medium text-stone-500">{{ t('assets.linkedEmails') }}:</span>
            <span v-for="(em, ei) in asset.emails" :key="ei" class="ml-1">
              {{ em.address }} ({{ t(`assets.purposes.${em.purpose}`) }})<span v-if="ei < asset.emails.length - 1">;</span>
            </span>
          </p>
          <a
            v-if="asset.adminUrl"
            :href="asset.adminUrl"
            class="text-sm text-stone-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ asset.adminUrl }}
          </a>
        </li>
      </ul>
      <p v-else class="lede">{{ t('projects.noAssets') }}</p>
    </section>

    <section class="space-y-3">
      <h2 class="section-title">{{ t('projects.dependencies') }}</h2>
      <form v-if="data.assets?.length" class="flex flex-wrap items-center gap-2" @submit.prevent="addDependency">
        <select v-model="depFrom" required class="field w-auto">
          <option value="">{{ t('projects.depFrom') }}</option>
          <option v-for="a in data.assets" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="depTo" required class="field w-auto">
          <option value="">{{ t('projects.depTo') }}</option>
          <option v-for="a in data.assets" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="depType" class="field w-auto">
          <option v-for="relation in RELATION_TYPES" :key="relation" :value="relation">
            {{ t(`dependencies.relationTypes.${relation}`) }}
          </option>
        </select>
        <button type="submit" class="btn-secondary">{{ t('common.add') }}</button>
      </form>
      <ul v-if="data.dependencies?.length" class="list-card text-sm">
        <li v-for="d in data.dependencies" :key="d.id" class="flex flex-wrap items-center gap-2 px-4 py-2">
          <span>{{ t(`dependencies.relationTypes.${d.relationType}`) }}</span>
          <VerificationChip :status="d.verificationStatus" />
        </li>
      </ul>
      <p v-else-if="data.assets?.length" class="lede">{{ t('projects.noDependencies') }}</p>
    </section>

    <section class="rounded-xl border border-red-200 bg-red-50/50 p-5">
      <h2 class="text-lg font-medium text-red-900">{{ t('projects.deleteTitle') }}</h2>
      <p class="mt-1 text-sm text-red-800/90">{{ t('projects.deleteHint') }}</p>
      <button
        v-if="!showDeleteConfirm"
        type="button"
        class="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
        @click="showDeleteConfirm = true"
      >
        {{ t('projects.deleteProject') }}
      </button>
      <form v-else class="mt-4 max-w-md space-y-3" @submit.prevent="deleteProject">
        <label class="block text-sm">
          <span class="font-medium text-red-900">{{ t('projects.deleteConfirmLabel') }}</span>
          <input
            v-model="deleteConfirmName"
            type="text"
            :placeholder="data.project.name"
            class="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2"
            autocomplete="off"
          />
        </label>
        <p v-if="deleteError" class="text-sm text-red-700">{{ deleteError }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="submit"
            class="rounded-lg bg-red-800 px-4 py-2 text-sm text-white disabled:opacity-50"
            :disabled="!canDelete || deleteLoading"
          >
            {{ t('projects.deleteConfirmButton') }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm"
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
    </section>
  </div>
</template>
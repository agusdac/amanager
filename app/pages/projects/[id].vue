<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const id = computed(() => String(route.params.id))

const { data, refresh, pending } = await useFetch(() => `/api/projects/${id.value}`, {
  watch: [id],
})

const showAssetForm = ref(false)
const assetName = ref('')
const assetType = ref('service')
const assetAdminUrl = ref('')
const assetError = ref('')
const assetLoading = ref(false)

const depFrom = ref('')
const depTo = ref('')
const depType = ref('depends_on')

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
        adminUrl: assetAdminUrl.value || undefined,
      },
    })
    assetName.value = ''
    assetAdminUrl.value = ''
    showAssetForm.value = false
    await refresh()
  } catch {
    assetError.value = 'Could not create asset'
  } finally {
    assetLoading.value = false
  }
}
</script>

<template>
  <div v-if="pending" class="text-stone-600">{{ t('common.loading') }}</div>
  <div v-else-if="data?.project" class="space-y-8">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">{{ data.project.name }}</h1>
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
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium">Assets</h2>
        <button
          type="button"
          class="rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100"
          @click="showAssetForm = !showAssetForm"
        >
          {{ t('assets.add') }}
        </button>
      </div>

      <form
        v-if="showAssetForm"
        class="space-y-3 rounded-lg border border-stone-200 bg-white p-4"
        @submit.prevent="createAsset"
      >
        <label class="block text-sm">
          <span>{{ t('assets.name') }}</span>
          <input v-model="assetName" required class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span>{{ t('assets.type') }}</span>
          <input v-model="assetType" required class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span>{{ t('assets.adminUrl') }}</span>
          <input v-model="assetAdminUrl" type="url" class="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
        </label>
        <p v-if="assetError" class="text-sm text-red-600">{{ assetError }}</p>
        <button type="submit" class="rounded bg-stone-900 px-3 py-2 text-sm text-white" :disabled="assetLoading">
          {{ t('assets.create') }}
        </button>
      </form>

      <ul v-if="data.assets?.length" class="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        <li v-for="asset in data.assets" :key="asset.id" class="px-4 py-3">
          <div class="font-medium">{{ asset.name }}</div>
          <div class="text-sm text-stone-500">{{ asset.type }} · {{ asset.status }}</div>
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
      <p v-else class="text-sm text-stone-500">No assets linked yet.</p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">{{ t('projects.dependencies') }}</h2>
      <form v-if="data.assets?.length" class="flex flex-wrap gap-2 text-sm" @submit.prevent="addDependency">
        <select v-model="depFrom" required class="rounded border px-2 py-1">
          <option value="">From</option>
          <option v-for="a in data.assets" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="depTo" required class="rounded border px-2 py-1">
          <option value="">To</option>
          <option v-for="a in data.assets" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="depType" class="rounded border px-2 py-1">
          <option value="depends_on">depends_on</option>
          <option value="hosted_on">hosted_on</option>
          <option value="deployed_from">deployed_from</option>
          <option value="authenticated_by">authenticated_by</option>
        </select>
        <button type="submit" class="rounded border px-2 py-1">{{ t('common.add') }}</button>
      </form>
      <ul v-if="data.dependencies?.length" class="divide-y rounded-lg border bg-white text-sm">
        <li v-for="d in data.dependencies" :key="d.id" class="px-4 py-2">
          {{ d.relationType }} · {{ d.verificationStatus }}
        </li>
      </ul>
    </section>
  </div>
</template>
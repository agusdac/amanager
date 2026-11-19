<script setup lang="ts">
type ImpactEdge = {
  fromAssetId?: string
  toAssetId?: string
  fromName: string
  toName: string
  relationType: string
  verificationStatus: string
  depth?: number
}

type EntityOption = { id: string; label: string }

const props = defineProps<{
  assetOptions: EntityOption[]
  identityOptions: EntityOption[]
  initialMode?: 'asset' | 'identity'
  initialEntityId?: string
  autoRun?: boolean
}>()

const { t } = useI18n()
const mode = ref<'asset' | 'identity'>(props.initialMode ?? 'asset')
const entityId = ref(props.initialEntityId ?? '')
const loading = ref(false)
const error = ref('')
const edges = ref<ImpactEdge[]>([])
const linkedAssets = ref<{ id: string; name: string }[]>([])

const options = computed(() => (mode.value === 'asset' ? props.assetOptions : props.identityOptions))

watch(mode, () => {
  if (props.initialEntityId && mode.value === props.initialMode) {
    entityId.value = props.initialEntityId
  } else {
    entityId.value = ''
  }
  edges.value = []
  linkedAssets.value = []
  error.value = ''
})

onMounted(() => {
  if (props.initialEntityId) {
    entityId.value = props.initialEntityId
    if (props.autoRun !== false) void run()
  }
})

async function run() {
  error.value = ''
  if (!entityId.value) return
  loading.value = true
  try {
    const result = await $fetch<{
      edges: ImpactEdge[]
      linkedAssets?: { id: string; name: string }[]
    }>('/api/impact', {
      query: { entityType: mode.value, entityId: entityId.value },
    })
    edges.value = result.edges ?? []
    linkedAssets.value = result.linkedAssets ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e)
    edges.value = []
    linkedAssets.value = []
  } finally {
    loading.value = false
  }
}

function relationLabel(type: string) {
  const key = `dependencies.relationTypes.${type}`
  const translated = t(key)
  return translated !== key ? translated : type.replaceAll('_', ' ')
}
</script>

<template>
  <section class="card p-5">
    <h2 class="section-title">{{ t('impact.title') }}</h2>
    <p class="lede mt-1">{{ t('impact.hint') }}</p>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded border px-3 py-1.5 text-sm transition-colors"
        :class="mode === 'asset' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'"
        @click="mode = 'asset'"
      >
        {{ t('impact.byAsset') }}
      </button>
      <button
        type="button"
        class="rounded border px-3 py-1.5 text-sm transition-colors"
        :class="mode === 'identity' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'"
        @click="mode = 'identity'"
      >
        {{ t('impact.byIdentity') }}
      </button>
    </div>

    <div class="mt-4 flex flex-wrap items-end gap-2">
      <label class="block min-w-[12rem] flex-1">
        <span class="label">{{ t('impact.pickEntity') }}</span>
        <select v-model="entityId" class="field mt-1.5">
          <option value="">{{ t('impact.selectPlaceholder') }}</option>
          <option v-for="opt in options" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
        </select>
      </label>
      <button
        type="button"
        class="btn-primary"
        :disabled="loading || !entityId"
        @click="run"
      >
        {{ loading ? t('common.loading') : t('impact.run') }}
      </button>
    </div>

    <p v-if="error" class="error-text mt-3">{{ error }}</p>

    <div v-if="linkedAssets.length" class="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm">
      <p class="font-medium text-stone-700">{{ t('impact.linkedAssets') }}</p>
      <ul class="mt-1 list-inside list-disc text-stone-600">
        <li v-for="a in linkedAssets" :key="a.id">{{ a.name }}</li>
      </ul>
    </div>

    <div v-if="edges.length" class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[28rem] text-left text-sm">
        <thead class="border-b text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th class="py-2 pr-3">{{ t('impact.colFrom') }}</th>
            <th class="py-2 pr-3">{{ t('impact.colTo') }}</th>
            <th class="py-2 pr-3">{{ t('impact.colRelation') }}</th>
            <th class="py-2">{{ t('impact.colVerification') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(e, i) in edges" :key="i" class="border-b border-stone-100">
            <td class="py-2 pr-3 font-medium text-stone-800">
              <NuxtLink
                v-if="e.fromAssetId"
                :to="`/assets/${e.fromAssetId}`"
                class="hover:underline"
              >
                {{ e.fromName }}
              </NuxtLink>
              <span v-else>{{ e.fromName }}</span>
            </td>
            <td class="py-2 pr-3 text-stone-800">
              <NuxtLink
                v-if="e.toAssetId"
                :to="`/assets/${e.toAssetId}`"
                class="hover:underline"
              >
                {{ e.toName }}
              </NuxtLink>
              <span v-else>{{ e.toName }}</span>
            </td>
            <td class="py-2 pr-3 text-stone-600">{{ relationLabel(e.relationType) }}</td>
            <td class="py-2">
              <VerificationChip :status="e.verificationStatus" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="entityId && !loading && !error" class="mt-4 text-sm text-stone-500">{{ t('impact.empty') }}</p>
  </section>
</template>
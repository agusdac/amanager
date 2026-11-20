<script setup lang="ts">
import { INFRASTRUCTURE_LINK_TYPES } from '~/constants/assetTypeFields'
import { RELATION_TYPE_KEYS } from '~/constants/inventory'

const props = withDefaults(
  defineProps<{
    assetId: string
    assetType: string
    projectAssetOptions: { id: string; name: string; type: string }[]
    embedded?: boolean
  }>(),
  { embedded: false },
)

const emit = defineEmits<{ linked: [] }>()

const { t } = useI18n()

const targetId = ref('')
const relationType = ref<(typeof RELATION_TYPE_KEYS)[number]>('hosted_on')
const loading = ref(false)
const error = ref('')

const isInfraType = computed(() =>
  INFRASTRUCTURE_LINK_TYPES.includes(props.assetType as (typeof INFRASTRUCTURE_LINK_TYPES)[number]),
)

const show = computed(() => props.embedded || isInfraType.value)

const peerOptions = computed(() => props.projectAssetOptions.filter((a) => a.id !== props.assetId))

const titleKey = computed(() =>
  props.embedded && !isInfraType.value ? 'assets.depAddTitle' : 'assets.infraLinkTitle',
)
const hintKey = computed(() =>
  props.embedded && !isInfraType.value ? 'assets.depAddHint' : 'assets.infraLinkHint',
)

watch(
  () => props.assetType,
  () => {
    relationType.value = isInfraType.value ? 'hosted_on' : 'depends_on'
  },
  { immediate: true },
)

async function link() {
  if (!targetId.value) return
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/dependencies', {
      method: 'POST',
      body: {
        fromAssetId: props.assetId,
        toAssetId: targetId.value,
        relationType: relationType.value,
      },
    })
    targetId.value = ''
    emit('linked')
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="show" class="space-y-4">
    <header class="space-y-1">
      <h3 class="text-sm font-semibold text-ink">{{ t(titleKey) }}</h3>
      <p class="text-xs leading-relaxed text-muted">{{ t(hintKey) }}</p>
    </header>

    <p v-if="!peerOptions.length" class="callout callout-neutral text-sm">
      <span class="callout-body">{{ t('assets.depAddNeedProject') }}</span>
    </p>

    <form
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
      @submit.prevent="link"
    >
      <label class="block text-sm sm:col-span-2 lg:col-span-1">
        <span class="label">{{ t('assets.infraLinkTarget') }}</span>
        <select v-model="targetId" required class="field mt-1.5">
          <option value="">{{ t('assets.infraLinkPick') }}</option>
          <option v-for="a in peerOptions" :key="a.id" :value="a.id">
            {{ a.name }} · {{ t(`assets.types.${a.type}`, a.type) }}
          </option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="label">{{ t('assets.infraLinkRelation') }}</span>
        <select v-model="relationType" class="field mt-1.5">
          <option v-for="relation in RELATION_TYPE_KEYS" :key="relation" :value="relation">
            {{ t(`dependencies.relationTypes.${relation}`) }}
          </option>
        </select>
      </label>
      <button type="submit" class="btn-secondary sm:col-span-2 lg:col-span-1 lg:w-fit" :disabled="loading">
        {{ t('assets.infraLinkAdd') }}
      </button>
    </form>
    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>
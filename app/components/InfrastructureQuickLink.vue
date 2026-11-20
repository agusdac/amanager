<script setup lang="ts">
import { INFRASTRUCTURE_LINK_TYPES } from '~/constants/assetTypeFields'

const props = defineProps<{
  assetId: string
  assetType: string
  projectAssetOptions: { id: string; name: string; type: string }[]
}>()

const emit = defineEmits<{ linked: [] }>()

const { t } = useI18n()

const targetId = ref('')
const relationType = ref<'hosted_on' | 'depends_on'>('hosted_on')
const loading = ref(false)
const error = ref('')

const show = computed(() => INFRASTRUCTURE_LINK_TYPES.includes(props.assetType as (typeof INFRASTRUCTURE_LINK_TYPES)[number]))

const peerOptions = computed(() =>
  props.projectAssetOptions.filter((a) => a.id !== props.assetId && a.type !== props.assetType),
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
  <section v-if="show" class="card mt-6 border-dashed border-stone-300 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-900/80 dark:bg-stone-900/80 p-5">
    <h2 class="text-sm font-medium text-stone-800 dark:text-stone-200">{{ t('assets.infraLinkTitle') }}</h2>
    <p class="mt-1 text-xs text-muted">{{ t('assets.infraLinkHint') }}</p>
    <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="link">
      <label class="block min-w-[12rem] flex-1 text-sm">
        <span class="label">{{ t('assets.infraLinkTarget') }}</span>
        <select v-model="targetId" required class="field mt-1.5">
          <option value="">{{ t('assets.infraLinkPick') }}</option>
          <option v-for="a in peerOptions" :key="a.id" :value="a.id">
            {{ a.name }} ({{ t(`assets.types.${a.type}`, a.type) }})
          </option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="label">{{ t('assets.infraLinkRelation') }}</span>
        <select v-model="relationType" class="field mt-1.5 w-auto">
          <option value="hosted_on">{{ t('dependencies.relationTypes.hosted_on') }}</option>
          <option value="depends_on">{{ t('dependencies.relationTypes.depends_on') }}</option>
        </select>
      </label>
      <button type="submit" class="btn-secondary" :disabled="loading">
        {{ t('assets.infraLinkAdd') }}
      </button>
    </form>
    <p v-if="error" class="error-text mt-2">{{ error }}</p>
  </section>
</template>
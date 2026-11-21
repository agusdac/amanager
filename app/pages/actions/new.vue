<script setup lang="ts">
import { DEFAULT_ACTION_KIND, defaultBodyForKind } from '#shared/actions/kindDefaults'
import type { ActionKind } from '#shared/schemas/actions'
import { buildAssetInsertLines } from '#shared/actions/insertFromAsset'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { projectId: scopeProjectId } = useWorkspaceScope()

useAppPageTitle('actions.newTitle')

const assetId = computed(() => (typeof route.query.assetId === 'string' ? route.query.assetId : ''))
const projectId = computed(() => {
  if (typeof route.query.projectId === 'string' && route.query.projectId) return route.query.projectId
  return scopeProjectId.value
})

const assetFetchUrl = computed(() => (assetId.value ? `/api/assets/${assetId.value}` : null))
const { data: assetPack } = await useFetch(assetFetchUrl, { watch: [assetFetchUrl] })

const title = ref('')
const bodyMarkdown = ref(defaultBodyForKind(DEFAULT_ACTION_KIND))
const kind = ref<ActionKind>(DEFAULT_ACTION_KIND)
const pinned = ref(false)
const formError = ref('')
const saving = ref(false)

const backHref = computed(() => {
  if (assetId.value) return `/assets/${assetId.value}?tab=actions`
  if (projectId.value) return `/projects/${projectId.value}?tab=actions`
  return '/actions'
})

function insertFromAsset() {
  const asset = assetPack.value?.asset
  if (!asset) return
  const snippet = buildAssetInsertLines({
    name: asset.name,
    adminUrl: asset.adminUrl,
    publicUrl: asset.publicUrl,
    attributesJson: asset.attributesJson,
  })
  bodyMarkdown.value = bodyMarkdown.value.trim()
    ? `${bodyMarkdown.value.trimEnd()}\n\n${snippet}`
    : snippet
}

async function save() {
  formError.value = ''
  if (!title.value.trim() || !bodyMarkdown.value.trim()) {
    formError.value = t('actions.fieldsRequired')
    return
  }
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      title: title.value.trim(),
      bodyMarkdown: bodyMarkdown.value.trim(),
      kind: kind.value,
      pinned: pinned.value,
    }
    if (assetId.value) body.assetId = assetId.value
    else if (projectId.value) body.projectId = projectId.value

    const res = await $fetch<{ action: { id: string } }>('/api/actions', { method: 'POST', body })
    await router.push(`/actions/${res.action.id}`)
  } catch (e: unknown) {
    formError.value = formatApiError(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <NuxtLink :to="backHref" class="btn-secondary text-sm">{{ t('common.cancel') }}</NuxtLink>

    <form class="card space-y-5 p-6" @submit.prevent="save">
      <h1 class="page-title">{{ t('actions.newTitle') }}</h1>
      <ActionKindField v-model="kind" v-model:body-markdown="bodyMarkdown" />
      <label class="form-field">
        <span class="label">{{ t('actions.fieldTitle') }}</span>
        <input v-model="title" class="field" required />
      </label>
      <label v-if="assetId" class="inline-flex items-center gap-2 text-sm">
        <input v-model="pinned" type="checkbox" class="checkbox" />
        {{ t('actions.fieldPinned') }}
      </label>
      <div class="form-field">
        <span class="label">{{ t('actions.fieldBody') }}</span>
        <ActionMarkdownEditor v-model="bodyMarkdown" :rows="kind === 'command' ? 14 : 12" />
      </div>
      <ActionBodyViewer :markdown="bodyMarkdown" />
      <div v-if="assetId && assetPack?.asset" class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary text-sm" @click="insertFromAsset">
          {{ t('actions.insertFromAsset') }}
        </button>
      </div>
      <p v-if="formError" class="text-sm text-red-700" role="alert">{{ formError }}</p>
      <button type="submit" class="btn-primary" :disabled="saving">{{ t('common.save') }}</button>
    </form>
  </div>
</template>
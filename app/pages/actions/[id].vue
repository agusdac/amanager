<script setup lang="ts">
import { DEFAULT_ACTION_KIND, defaultBodyForKind } from '#shared/actions/kindDefaults'
import type { ActionKind } from '#shared/schemas/actions'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const actionId = computed(() => String(route.params.id))

const { data, refresh, pending, error } = await useFetch(() => `/api/actions/${actionId.value}`, {
  watch: [actionId],
})

const mode = ref<'read' | 'edit'>('read')
const title = ref('')
const bodyMarkdown = ref('')
const kind = ref<ActionKind>(DEFAULT_ACTION_KIND)
const pinned = ref(false)
const formError = ref('')
const saving = ref(false)
const deleting = ref(false)
const deleteDialogOpen = ref(false)

watch(
  data,
  (d) => {
    if (!d?.action) return
    title.value = d.action.title
    bodyMarkdown.value = d.action.bodyMarkdown
    kind.value = (d.action.kind as ActionKind) ?? DEFAULT_ACTION_KIND
    pinned.value = d.action.pinned
  },
  { immediate: true },
)

useAppPageTitle(computed(() => data.value?.action?.title ?? t('pageTitles.actions')))

const backHref = computed(() => {
  const a = data.value?.action
  if (!a) return '/actions'
  if (a.assetId) return `/assets/${a.assetId}?tab=actions`
  if (a.projectId) return `/projects/${a.projectId}?tab=actions`
  return '/actions'
})

const assetFetchUrl = computed(() => {
  const id = data.value?.action?.assetId
  return id ? `/api/assets/${id}` : null
})
const { data: assetPack } = await useFetch(assetFetchUrl, { watch: [assetFetchUrl] })

const assetLink = computed(() => {
  const assetId = data.value?.action?.assetId
  if (!assetId) return null
  return {
    id: assetId,
    href: `/assets/${assetId}`,
    name: assetPack.value?.asset?.name ?? t('actions.openAsset'),
  }
})

function startEdit() {
  mode.value = 'edit'
}

function cancelEdit() {
  const d = data.value?.action
  if (d) {
    title.value = d.title
    bodyMarkdown.value = d.bodyMarkdown
    kind.value = (d.kind as ActionKind) ?? DEFAULT_ACTION_KIND
    pinned.value = d.pinned
  }
  mode.value = 'read'
  formError.value = ''
}

async function save() {
  formError.value = ''
  if (!title.value.trim() || !bodyMarkdown.value.trim()) {
    formError.value = t('actions.fieldsRequired')
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/actions/${actionId.value}`, {
      method: 'PATCH',
      body: {
        title: title.value.trim(),
        bodyMarkdown: bodyMarkdown.value.trim(),
        kind: kind.value,
        pinned: pinned.value,
      },
    })
    await refresh()
    mode.value = 'read'
  } catch (e: unknown) {
    formError.value = formatApiError(e)
  } finally {
    saving.value = false
  }
}

async function confirmRemove() {
  deleting.value = true
  try {
    await $fetch(`/api/actions/${actionId.value}`, { method: 'DELETE' })
    await router.push(backHref.value)
  } catch (e: unknown) {
    formError.value = formatApiError(e)
  } finally {
    deleting.value = false
  }
}

</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink :to="backHref" class="btn-secondary text-sm">{{ t('common.back') }}</NuxtLink>
      <FavoriteStarButton v-if="data?.action" target-type="action" :target-id="actionId" />
    </div>

    <p v-if="pending" class="text-muted">{{ t('common.loading') }}</p>
    <p v-else-if="error" class="text-sm text-red-700">{{ t('common.errorGeneric') }}</p>

    <template v-else-if="data?.action">
      <header class="space-y-2">
        <p v-if="assetLink" class="text-sm text-muted">
          {{ t('actions.linkedAsset') }}
          <NuxtLink :to="assetLink.href" class="font-medium text-ink underline">{{ assetLink.name }}</NuxtLink>
        </p>
        <div v-if="mode === 'read'" class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-subtle">
              {{ t(`actions.kinds.${kind}`) }}
            </p>
            <h1 class="page-title">{{ data.action.title }}</h1>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary text-sm" @click="startEdit">{{ t('common.edit') }}</button>
            <button type="button" class="btn-danger text-sm" :disabled="deleting" @click="deleteDialogOpen = true">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </header>

      <div v-if="mode === 'read'" class="card p-6">
        <ActionBodyViewer :markdown="data.action.bodyMarkdown" />
      </div>

      <form v-else class="card space-y-5 p-6" @submit.prevent="save">
        <h1 class="text-lg font-semibold text-ink">{{ t('actions.editTitle') }}</h1>
        <ActionKindField v-model="kind" v-model:body-markdown="bodyMarkdown" />
        <label class="form-field">
          <span class="label">{{ t('actions.fieldTitle') }}</span>
          <input v-model="title" class="field" required />
        </label>
        <label v-if="data.action.assetId" class="inline-flex items-center gap-2 text-sm">
          <input v-model="pinned" type="checkbox" class="checkbox" />
          {{ t('actions.fieldPinned') }}
        </label>
        <div class="form-field">
          <span class="label">{{ t('actions.fieldBody') }}</span>
          <ActionMarkdownEditor v-model="bodyMarkdown" :rows="kind === 'command' ? 14 : 12" />
        </div>
        <ActionBodyViewer :markdown="bodyMarkdown" />
        <p v-if="formError" class="text-sm text-red-700" role="alert">{{ formError }}</p>
        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn-primary" :disabled="saving">{{ t('common.save') }}</button>
          <button type="button" class="btn-secondary" @click="cancelEdit">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </template>

    <AppConfirmDialog
      v-model:open="deleteDialogOpen"
      :title="t('actions.deleteTitle')"
      :description="t('actions.confirmDelete')"
      :confirm-label="t('common.delete')"
      @confirm="confirmRemove"
    />
  </div>
</template>
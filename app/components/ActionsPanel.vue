<script setup lang="ts">
import { CheckSquare, Code, FileText, Pin } from 'lucide-vue-next'
import type { ActionKind } from '#shared/schemas/actions'

type ActionRow = {
  id: string
  title: string
  bodyMarkdown: string
  pinned: boolean
  kind: string | null
  assetId: string | null
  projectId: string | null
}

const props = withDefaults(
  defineProps<{
    listUrl: string
    fixedAssetId?: string
    fixedProjectId?: string
    listFilter?: 'all' | 'project' | 'asset' | 'workspace'
    showHeader?: boolean
  }>(),
  { showHeader: true },
)

const { t } = useI18n()

const { data, refresh, pending } = await useFetch<{ actions: ActionRow[] }>(() => props.listUrl, {
  watch: [() => props.listUrl],
})

const visibleActions = computed(() => {
  const rows = data.value?.actions ?? []
  const f = props.listFilter ?? 'all'
  if (f === 'project') return rows.filter((a) => a.projectId && !a.assetId)
  if (f === 'asset') return rows.filter((a) => Boolean(a.assetId))
  if (f === 'workspace') return rows.filter((a) => !a.projectId && !a.assetId)
  return rows
})

const newActionHref = computed(() => {
  const q = new URLSearchParams()
  if (props.fixedAssetId) q.set('assetId', props.fixedAssetId)
  if (props.fixedProjectId) q.set('projectId', props.fixedProjectId)
  return q.toString() ? `/actions/new?${q}` : '/actions/new'
})

const kindIcons: Record<ActionKind, typeof Code> = {
  command: Code,
  checklist: CheckSquare,
  reference: FileText,
}

function previewLine(md: string): string {
  const line = md.split('\n').find((l) => l.trim() && !l.trim().startsWith('```')) ?? ''
  return line.replace(/^[-*]\s*\[[ x]\]\s*/, '').replace(/^#+\s*/, '').slice(0, 72)
}

function openActionById(actionId: string) {
  navigateTo(`/actions/${actionId}`)
}

defineExpose({ openActionById, refresh })
</script>

<template>
  <div class="space-y-4">
    <div v-if="showHeader" class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-ink">{{ t('actions.title') }}</h2>
        <p class="text-sm text-muted">{{ t('actions.assetTabHint') }}</p>
      </div>
      <NuxtLink :to="newActionHref" class="btn-primary text-sm">{{ t('actions.add') }}</NuxtLink>
    </div>

    <p v-if="pending" class="text-sm text-muted">{{ t('common.loading') }}</p>

    <div v-else-if="visibleActions.length" class="grid gap-3 sm:grid-cols-2">
      <article
        v-for="row in visibleActions"
        :key="row.id"
        class="group relative rounded-xl border border-rule bg-surface p-4 shadow-sm transition hover:border-stone-400 hover:shadow dark:hover:border-stone-600"
      >
        <div class="absolute right-3 top-3 flex items-center gap-1">
          <FavoriteStarButton target-type="action" :target-id="row.id" size="sm" />
        </div>
        <NuxtLink :to="`/actions/${row.id}`" class="block space-y-2 pr-8">
          <div class="flex flex-wrap items-center gap-2">
            <component
              :is="kindIcons[(row.kind as ActionKind) ?? 'command']"
              class="h-4 w-4 text-subtle"
              aria-hidden="true"
            />
            <span class="text-xs font-medium uppercase tracking-wide text-subtle">
              {{ t(`actions.kinds.${row.kind ?? 'command'}`) }}
            </span>
            <span v-if="row.pinned" class="inline-flex items-center gap-0.5 text-xs text-amber-700 dark:text-amber-400">
              <Pin class="h-3 w-3" />
              {{ t('actions.pinned') }}
            </span>
          </div>
          <h3 class="font-semibold text-ink group-hover:underline">{{ row.title }}</h3>
          <p class="line-clamp-2 text-sm text-muted">{{ previewLine(row.bodyMarkdown) || '—' }}</p>
        </NuxtLink>
      </article>
    </div>

    <p v-else class="rounded-lg border border-dashed border-rule px-4 py-8 text-center text-sm text-subtle">
      {{ t('actions.empty') }}
    </p>
  </div>
</template>
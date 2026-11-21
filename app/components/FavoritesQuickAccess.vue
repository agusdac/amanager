<script setup lang="ts">
import { GripVertical, Mail, User, Zap } from 'lucide-vue-next'
import type { FavoriteTargetType } from '#shared/schemas/actions'

const props = withDefaults(
  defineProps<{
    variant?: 'home' | 'sidebar'
    compact?: boolean
    maxItems?: number
    enableReorder?: boolean
  }>(),
  { variant: 'home', maxItems: 12, enableReorder: true },
)

const { t } = useI18n()
const { projectId } = useWorkspaceScope()
const { items, ensureLoaded, refresh, reorder, loading } = useFavorites()

const { data: session } = useSessionFetch()

onMounted(() => {
  void ensureLoaded()
})

watch(
  () => session.value?.user?.workspaceId,
  (wsId, prev) => {
    if (wsId && prev && wsId !== prev) void refresh()
  },
)

const visible = computed(() => {
  let list = items.value
  if (projectId.value) {
    list = list.filter(
      (f) =>
        f.projectId === projectId.value ||
        f.targetType === 'identity' ||
        f.targetType === 'email_address',
    )
  }
  return list.slice(0, props.maxItems)
})

const showBlock = computed(() => {
  if (props.variant === 'sidebar') return visible.value.length > 0
  return true
})

const draggingId = ref<string | null>(null)

function onDragStart(id: string, event: DragEvent) {
  draggingId.value = id
  event.dataTransfer?.setData('text/plain', id)
  event.dataTransfer!.effectAllowed = 'move'
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}

async function onDrop(targetId: string) {
  const sourceId = draggingId.value
  draggingId.value = null
  if (!sourceId || sourceId === targetId || !props.enableReorder) return

  const ids = items.value.map((f) => f.id)
  const from = ids.indexOf(sourceId)
  const to = ids.indexOf(targetId)
  if (from < 0 || to < 0) return
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  await reorder(next)
}

function typeLabel(type: FavoriteTargetType): string {
  return t(`favorites.types.${type}`)
}
</script>

<template>
  <section
    v-if="showBlock"
    :aria-label="t('favorites.title')"
    :class="variant === 'home' ? 'space-y-3' : 'space-y-2'"
  >
    <div v-if="variant === 'home'" class="flex flex-wrap items-end justify-between gap-3">
      <header>
        <h2 id="home-favorites-heading" class="text-base font-semibold text-ink">{{ t('favorites.title') }}</h2>
        <p class="mt-1 text-sm text-muted">{{ t('favorites.homeHint') }}</p>
      </header>
    </div>

    <p v-if="variant === 'sidebar' && !compact" class="text-xs font-semibold uppercase tracking-wide text-subtle">
      {{ t('favorites.title') }}
    </p>

    <template v-if="loading && !items.length">
      <p class="text-xs text-muted">{{ t('common.loading') }}</p>
    </template>

    <template v-else-if="variant === 'home' && !visible.length">
    <div
      class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-rule bg-stone-50/50 px-4 py-5 text-sm text-muted dark:bg-stone-900/30"
    >
      <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-stone-200/80 text-amber-600 dark:bg-stone-800" aria-hidden="true">★</span>
      <p>{{ t('favorites.homeEmpty') }}</p>
    </div>
    </template>

    <div
      v-else-if="variant === 'home' && visible.length"
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <article
        v-for="f in visible"
        :key="f.id"
        class="group relative"
        :draggable="enableReorder"
        @dragstart="onDragStart(f.id, $event)"
        @dragover="onDragOver"
        @drop="onDrop(f.id)"
      >
        <GripVertical
          v-if="enableReorder"
          class="absolute left-1 top-1 z-10 h-4 w-4 cursor-grab text-faint opacity-0 transition group-hover:opacity-100"
        />
        <NuxtLink
          :to="f.href"
          class="favorite-card block h-full rounded-xl border border-rule bg-surface p-4 shadow-sm transition hover:border-stone-400 hover:shadow-md dark:hover:border-stone-600"
        >
          <FavoriteTypeIcon :favorite="f" class="mb-3" />
          <p class="font-semibold text-ink">{{ f.label }}</p>
          <p class="mt-0.5 text-xs text-subtle">{{ typeLabel(f.targetType) }}</p>
          <p v-if="f.subtitle" class="mt-2 text-sm text-muted">
            {{ t('favorites.onResource', { name: f.subtitle }) }}
          </p>
        </NuxtLink>
      </article>
    </div>

    <ul v-else-if="visible.length" class="space-y-0.5">
      <li
        v-for="f in visible"
        :key="f.id"
        class="group"
        :draggable="enableReorder && !compact"
        @dragstart="onDragStart(f.id, $event)"
        @dragover="onDragOver"
        @drop="onDrop(f.id)"
      >
        <NuxtLink
          :to="f.href"
          class="flex items-center gap-1.5 rounded-md text-sm transition hover:bg-stone-100/80 dark:hover:bg-stone-800/60"
          :class="compact ? 'justify-center px-0.5 py-1' : 'px-2 py-1.5'"
          :title="f.label"
        >
          <FavoriteTypeIcon :favorite="f" :dense="true" />
          <span v-if="!compact" class="min-w-0 truncate text-ink">{{ f.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
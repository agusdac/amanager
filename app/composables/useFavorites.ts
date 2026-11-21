import type { FavoriteTargetType } from '#shared/schemas/actions'

export type FavoriteRow = {
  id: string
  targetType: FavoriteTargetType
  targetId: string
  position: number
  label: string
  subtitle: string | null
  href: string
  projectId: string | null
  actionKind: string | null
  assetType: string | null
  linkedAssetId: string | null
  linkedAssetHref: string | null
}

const favoritesState = () =>
  useState<{ loaded: boolean; items: FavoriteRow[] }>('workspace-favorites', () => ({
    loaded: false,
    items: [],
  }))

export function useFavorites() {
  const state = favoritesState()
  const loading = ref(false)
  const { data: session } = useSessionFetch()

  function reset() {
    state.value = { loaded: false, items: [] }
  }

  async function refresh() {
    loading.value = true
    try {
      const res = await $fetch<{ favorites: FavoriteRow[] }>('/api/me/favorites')
      state.value = { loaded: true, items: res.favorites }
    } finally {
      loading.value = false
    }
  }

  if (import.meta.client) {
    watch(
      () => session.value?.user?.workspaceId,
      (wsId, prev) => {
        if (wsId && prev && wsId !== prev) {
          reset()
          void refresh()
        }
      },
    )
  }

  async function ensureLoaded() {
    if (!state.value.loaded) await refresh()
  }

  function isFavorited(targetType: FavoriteTargetType, targetId: string): boolean {
    return state.value.items.some(
      (f) => f.targetType === targetType && f.targetId === targetId,
    )
  }

  async function toggle(targetType: FavoriteTargetType, targetId: string) {
    const res = await $fetch<{ favorited: boolean }>('/api/me/favorites/toggle', {
      method: 'POST',
      body: { targetType, targetId },
    })
    await refresh()
    return res.favorited
  }

  async function reorder(orderedIds: string[]) {
    const items = orderedIds.map((id, position) => ({ id, position }))
    await $fetch('/api/me/favorites/reorder', { method: 'PATCH', body: { items } })
    await refresh()
  }

  const items = computed(() => state.value.items)

  return {
    items,
    loading,
    refresh,
    reset,
    ensureLoaded,
    isFavorited,
    toggle,
    reorder,
  }
}
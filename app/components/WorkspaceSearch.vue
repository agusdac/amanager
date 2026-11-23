<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const { projectId } = useWorkspaceScope()
const q = ref('')
const debouncedQ = ref('')
const rootRef = ref<HTMLElement | null>(null)
const mobileInputRef = ref<HTMLInputElement | null>(null)
const panelOpen = ref(false)
const mobileSheetOpen = ref(false)
const { setLocked: setSearchScrollLock } = useBodyScrollLock('workspace-search')

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(q, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQ.value = val.trim()
  }, 280)
  const len = val.trim().length
  if (len >= 2) panelOpen.value = true
  else if (len < 2) panelOpen.value = false
})

type SearchPayload = {
  assets?: { id: string; name: string; type: string; providerSlug?: string | null }[]
  emails?: { id: string; address: string; linkedAssets?: { id: string; name: string }[] }[]
  identities?: { id: string; label: string; providerName?: string | null }[]
}

const data = ref<SearchPayload | null>(null)
const pending = ref(false)

watch(debouncedQ, async (query) => {
  if (query.length < 2) {
    data.value = null
    return
  }
  pending.value = true
  try {
    const params = new URLSearchParams({ q: query })
    if (projectId.value) params.set('projectId', projectId.value)
    data.value = await $fetch<SearchPayload>(`/api/search?${params}`)
  } catch {
    data.value = null
  } finally {
    pending.value = false
  }
})

const hasResults = computed(() => {
  if (!data.value || debouncedQ.value.length < 2) return false
  return (
    (data.value.assets?.length ?? 0) > 0 ||
    (data.value.emails?.length ?? 0) > 0 ||
    (data.value.identities?.length ?? 0) > 0
  )
})

const showDesktopPanel = computed(
  () =>
    !mobileSheetOpen.value &&
    panelOpen.value &&
    debouncedQ.value.length >= 2 &&
    (pending.value || hasResults.value || !!data.value),
)

const showMobileResults = computed(
  () => mobileSheetOpen.value && debouncedQ.value.length >= 2 && (pending.value || hasResults.value || !!data.value),
)

function resetSearch() {
  q.value = ''
  debouncedQ.value = ''
  data.value = null
  panelOpen.value = false
  mobileSheetOpen.value = false
}

function onResultNavigate() {
  resetSearch()
}

function openMobileSearch() {
  mobileSheetOpen.value = true
  panelOpen.value = false
  nextTick(() => mobileInputRef.value?.focus())
}

function closeMobileSearch() {
  mobileSheetOpen.value = false
  panelOpen.value = false
}

function onDocMouseDown(event: MouseEvent) {
  if (mobileSheetOpen.value) return
  const el = rootRef.value
  if (el && !el.contains(event.target as Node)) panelOpen.value = false
}

function onEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (mobileSheetOpen.value) {
    closeMobileSearch()
    return
  }
  panelOpen.value = false
  ;(event.target as HTMLElement)?.blur?.()
}

watch(() => route.path, resetSearch)

watch(mobileSheetOpen, (open) => setSearchScrollLock(open))

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
  document.addEventListener('keydown', onEscape)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
  document.removeEventListener('keydown', onEscape)
})
</script>

<template>
  <div ref="rootRef" class="relative shrink-0 md:min-w-0 md:max-w-md md:flex-1">
    <h2 class="sr-only">{{ t('search.title') }}</h2>

    <button
      type="button"
      class="app-shell__icon-btn md:hidden"
      :aria-label="t('search.open')"
      :aria-expanded="mobileSheetOpen"
      @click="openMobileSearch"
    >
      <IconSearch class="h-[1.125rem] w-[1.125rem]" />
    </button>

    <label class="hidden min-w-0 md:block">
      <span class="sr-only">{{ t('search.placeholder') }}</span>
      <input
        v-model="q"
        type="search"
        class="field w-full py-1.5 text-sm"
        :placeholder="t('search.placeholder')"
        autocomplete="off"
        @focus="panelOpen = debouncedQ.length >= 2"
      />
    </label>

    <div
      v-if="showDesktopPanel"
      class="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(70vh,24rem)] overflow-y-auto rounded-lg border border-rule bg-surface p-3 text-sm shadow-lg"
      role="listbox"
    >
      <WorkspaceSearchResults
        :data="data"
        :pending="pending"
        :has-results="hasResults"
        :debounced-q="debouncedQ"
        @navigate="onResultNavigate"
      />
    </div>
  </div>

  <Teleport to="body">
    <div v-if="mobileSheetOpen" class="fixed inset-0 z-50 md:hidden" role="dialog" :aria-label="t('search.title')">
      <button
        type="button"
        class="absolute inset-0 bg-stone-900/40"
        :aria-label="t('common.close')"
        @click="closeMobileSearch"
      />
      <div
        class="relative flex max-h-[85vh] flex-col border-b border-rule bg-surface shadow-lg"
        @mousedown.stop
      >
        <div class="flex shrink-0 items-center gap-2 border-b border-rule px-3 py-2">
          <input
            ref="mobileInputRef"
            v-model="q"
            type="search"
            class="field min-w-0 flex-1 py-2 text-sm"
            :placeholder="t('search.placeholder')"
            autocomplete="off"
          />
          <button type="button" class="app-shell__icon-btn" :aria-label="t('common.close')" @click="closeMobileSearch">
            <IconX class="h-[1.125rem] w-[1.125rem]" />
          </button>
        </div>
        <div
          v-if="showMobileResults || (debouncedQ.length >= 2 && pending)"
          class="min-h-0 flex-1 overflow-y-auto p-3 text-sm"
        >
          <WorkspaceSearchResults
            :data="data"
            :pending="pending"
            :has-results="hasResults"
            :debounced-q="debouncedQ"
            @navigate="onResultNavigate"
          />
        </div>
        <p v-else-if="debouncedQ.length >= 2 && !pending" class="px-3 py-4 text-sm text-subtle">
          {{ t('search.empty') }}
        </p>
      </div>
    </div>
  </Teleport>
</template>
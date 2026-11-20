<script setup lang="ts">
import type { InventoryTargetType } from '../../shared/runbooks/inventoryTargets'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  targetType: InventoryTargetType
  projectId?: string
}>()

const emit = defineEmits<{
  select: [payload: { id: string; label: string }]
}>()

const { t } = useI18n()
const q = ref('')
const pending = ref(false)
const results = ref<Array<{ id: string; label: string; sublabel?: string | null }>>([])

let timer: ReturnType<typeof setTimeout> | undefined

async function runSearch() {
  const term = q.value.trim()
  if (term.length < 1) {
    results.value = []
    return
  }
  pending.value = true
  try {
    const res = await $fetch<{ results: typeof results.value }>('/api/inventory-picker', {
      query: {
        q: term,
        type: props.targetType,
        ...(props.projectId ? { projectId: props.projectId } : {}),
      },
    })
    results.value = res.results
  } catch {
    results.value = []
  } finally {
    pending.value = false
  }
}

watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(runSearch, 280)
})

watch(open, (isOpen) => {
  if (isOpen) {
    q.value = ''
    results.value = []
  }
})

function choose(row: { id: string; label: string }) {
  emit('select', { id: row.id, label: row.label })
  open.value = false
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0 bg-stone-900/45 backdrop-blur-[2px]" @click="open = false" />
      <div class="relative z-10 w-full max-w-md rounded-xl border border-rule bg-surface p-5 shadow-xl">
        <h2 class="text-lg font-medium text-ink">
          {{ t(`guides.templates.pickerTitle.${targetType}`) }}
        </h2>
        <p class="mt-1 text-sm text-muted">{{ t('guides.templates.pickerHint') }}</p>
        <input
          v-model="q"
          type="search"
          class="field mt-4 w-full"
          :placeholder="t('guides.templates.pickerSearchPh')"
          autofocus
        />
        <p v-if="pending" class="mt-3 text-sm text-subtle">{{ t('common.loading') }}</p>
        <ul v-else-if="results.length" class="mt-3 max-h-64 space-y-1 overflow-y-auto">
          <li v-for="row in results" :key="row.id">
            <button type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-soft" @click="choose(row)">
              <span class="font-medium text-ink">{{ row.label }}</span>
              <span v-if="row.sublabel" class="mt-0.5 block text-xs text-subtle">{{ row.sublabel }}</span>
            </button>
          </li>
        </ul>
        <p v-else-if="q.trim().length >= 1" class="mt-3 text-sm text-subtle">{{ t('guides.templates.pickerEmpty') }}</p>
        <button type="button" class="btn-secondary mt-4 w-full text-sm" @click="open = false">
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
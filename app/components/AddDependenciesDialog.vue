<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { Plus, Trash2 } from 'lucide-vue-next'
import { RELATION_TYPE_KEYS } from '~/constants/inventory'
import { UI_ICON_STROKE } from '~/components/icons/uiIconDefaults'

type AssetOption = { id: string; name: string }

type DraftRow = {
  key: string
  fromAssetId: string
  toAssetId: string
  relationType: (typeof RELATION_TYPE_KEYS)[number]
}

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  assets: AssetOption[]
}>()

const emit = defineEmits<{ created: [] }>()

const { t } = useI18n()

const sharedRelation = ref<(typeof RELATION_TYPE_KEYS)[number]>('depends_on')
const rows = ref<DraftRow[]>([])
const saving = ref(false)
const errorMessage = ref('')
const resultSummary = ref<{ created: number; skipped: number } | null>(null)

let rowKey = 0
function newRow(): DraftRow {
  rowKey += 1
  return {
    key: `row-${rowKey}`,
    fromAssetId: '',
    toAssetId: '',
    relationType: sharedRelation.value,
  }
}

function resetForm() {
  sharedRelation.value = 'depends_on'
  rows.value = [newRow()]
  errorMessage.value = ''
  resultSummary.value = null
}

watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

const validRows = computed(() =>
  rows.value.filter(
    (r) => r.fromAssetId && r.toAssetId && r.fromAssetId !== r.toAssetId,
  ),
)

function addRow() {
  rows.value.push(newRow())
}

function removeRow(key: string) {
  if (rows.value.length <= 1) {
    rows.value = [newRow()]
    return
  }
  rows.value = rows.value.filter((r) => r.key !== key)
}

function applySharedRelation() {
  for (const row of rows.value) row.relationType = sharedRelation.value
}

watch(sharedRelation, applySharedRelation)

async function submit() {
  errorMessage.value = ''
  resultSummary.value = null
  const items = validRows.value.map((r) => ({
    fromAssetId: r.fromAssetId,
    toAssetId: r.toAssetId,
    relationType: r.relationType,
  }))
  if (!items.length) {
    errorMessage.value = t('dependencies.addDialogNeedRow')
    return
  }
  saving.value = true
  try {
    const res = await $fetch<{ created: number; skipped: number }>('/api/dependencies/bulk', {
      method: 'POST',
      body: { items },
    })
    resultSummary.value = { created: res.created, skipped: res.skipped }
    if (res.created > 0) emit('created')
    if (res.created > 0 && res.skipped === 0) {
      open.value = false
      resetForm()
    }
  } catch (e: unknown) {
    errorMessage.value = formatApiError(e) || t('common.errorGeneric')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[100] bg-stone-900/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-[101] max-h-[min(92vh,40rem)] w-[min(calc(100vw-1.5rem),44rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-stone-200 bg-white p-5 shadow-2xl focus:outline-none dark:border-stone-700 dark:bg-stone-900 sm:p-6"
      >
        <DialogTitle class="text-lg font-semibold text-ink">
          {{ t('dependencies.addDialogTitle') }}
        </DialogTitle>
        <DialogDescription class="mt-2 text-sm leading-relaxed text-muted">
          {{ t('dependencies.addDialogLead') }}
        </DialogDescription>
        <p class="mt-2 text-xs text-subtle">{{ t('dependencies.addDialogDirection') }}</p>

        <label class="mt-4 block text-sm">
          <span class="label">{{ t('dependencies.addDialogDefaultRelation') }}</span>
          <select v-model="sharedRelation" class="field mt-1.5 w-full max-w-md">
            <option v-for="relation in RELATION_TYPE_KEYS" :key="relation" :value="relation">
              {{ t(`dependencies.relationTypes.${relation}`) }}
            </option>
          </select>
        </label>

        <div class="mt-4 space-y-3">
          <div
            v-for="(row, index) in rows"
            :key="row.key"
            class="rounded-lg border border-stone-200 bg-stone-50/60 p-3 dark:border-stone-700 dark:bg-stone-900/50"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase tracking-wide text-subtle">
                {{ t('dependencies.addDialogRowLabel', { n: index + 1 }) }}
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
                :aria-label="t('dependencies.addDialogRemoveRow')"
                @click="removeRow(row.key)"
              >
                <Trash2 class="h-3.5 w-3.5" :stroke-width="UI_ICON_STROKE" aria-hidden="true" />
                {{ t('common.remove') }}
              </button>
            </div>
            <div class="grid gap-2 sm:grid-cols-2">
              <label class="block text-sm">
                <span class="text-subtle">{{ t('projects.depFrom') }}</span>
                <select v-model="row.fromAssetId" class="field mt-1 w-full text-sm">
                  <option value="">{{ t('impact.selectPlaceholder') }}</option>
                  <option v-for="a in props.assets" :key="`from-${row.key}-${a.id}`" :value="a.id">
                    {{ a.name }}
                  </option>
                </select>
              </label>
              <label class="block text-sm">
                <span class="text-subtle">{{ t('projects.depTo') }}</span>
                <select v-model="row.toAssetId" class="field mt-1 w-full text-sm">
                  <option value="">{{ t('impact.selectPlaceholder') }}</option>
                  <option v-for="a in props.assets" :key="`to-${row.key}-${a.id}`" :value="a.id">
                    {{ a.name }}
                  </option>
                </select>
              </label>
            </div>
            <label class="mt-2 block text-sm sm:hidden">
              <span class="text-subtle">{{ t('impact.colRelation') }}</span>
              <select v-model="row.relationType" class="field mt-1 w-full text-sm">
                <option v-for="relation in RELATION_TYPE_KEYS" :key="relation" :value="relation">
                  {{ t(`dependencies.relationTypes.${relation}`) }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <button type="button" class="btn-secondary mt-3 w-full text-sm sm:w-auto" @click="addRow">
          <Plus class="mr-1.5 inline h-4 w-4" :stroke-width="UI_ICON_STROKE" aria-hidden="true" />
          {{ t('dependencies.addDialogAddRow') }}
        </button>

        <p v-if="resultSummary" class="mt-3 text-sm text-muted">
          {{
            t('dependencies.addDialogResult', {
              created: resultSummary.created,
              skipped: resultSummary.skipped,
            })
          }}
        </p>
        <p v-if="errorMessage" class="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
          {{ errorMessage }}
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <DialogClose as-child>
            <button type="button" class="btn-secondary text-sm" :disabled="saving">
              {{ t('common.cancel') }}
            </button>
          </DialogClose>
          <button
            type="button"
            class="btn-primary text-sm"
            :disabled="saving || !validRows.length"
            @click="submit"
          >
            {{ t('dependencies.addDialogSubmit', { count: validRows.length }) }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
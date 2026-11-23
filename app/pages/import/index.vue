<script setup lang="ts">
import type { ImportPreviewDuplicate, ImportTarget } from '#shared/import/contract'
import {
  missingRequiredColumns,
  suggestColumnMap,
  REQUIRED_ASSET_COLUMNS,
  headerNeedsManualMapping,
} from '#shared/import/column-presets'

const { t } = useI18n()
useAppPageTitle('pageTitles.import')
const { projectId } = useWorkspaceScope()
const { data: projectsData } = await useFetch('/api/projects')
const focusedProjectName = computed(() => {
  if (!projectId.value) return ''
  return projectsData.value?.projects?.find((p) => p.id === projectId.value)?.name ?? ''
})

type UiStep = 'prepare' | 'review' | 'done'

const step = ref<UiStep>('prepare')
const uploadKind = ref<'csv' | 'zip'>('csv')
const csvText = ref('')
const zipFile = ref<File | null>(null)
const columnMap = ref<Record<string, string>>({})
const headerList = ref<string[]>([])
const newProjectName = ref('')
const targetMode = ref<'workspace' | 'project' | 'new_project'>(projectId.value ? 'project' : 'workspace')

const previewResult = ref<{
  previewId: string
  ok: boolean
  summary: Record<string, number>
  errors: Array<{ rowIndex: number; message: string }>
  warnings: Array<{ rowIndex: number; message: string }>
  duplicates: ImportPreviewDuplicate[]
  intraBatchDuplicates: string[]
  previewRows: Array<Record<string, string | number>>
  headerRejected?: string[]
} | null>(null)
const resolutions = ref<Record<string, 'skip' | 'merge' | 'duplicate'>>({})
const batchId = ref('')
const pending = ref(false)
const errorMessage = ref('')
const sourceGuideOpen = ref(false)
const csvFileInput = ref<HTMLInputElement | null>(null)
const zipFileInput = ref<HTMLInputElement | null>(null)
const csvFileLabel = ref('')

const canonHeaders = [...REQUIRED_ASSET_COLUMNS, 'project', 'external_id', 'login_email', 'environment', 'admin_url', 'public_url', 'notes']

watch(projectId, (id) => {
  if (id && targetMode.value === 'workspace') targetMode.value = 'project'
})

function applySuggestedMapping() {
  columnMap.value = { ...suggestColumnMap(headerList.value) }
}

/** Send only remappings; Hilko-native headers need no columnMap in the API. */
function columnMapForApi(): Record<string, string> | undefined {
  const m = Object.fromEntries(
    Object.entries(columnMap.value).filter(
      ([src, dest]) => dest?.trim() && dest.trim() !== src.trim(),
    ),
  )
  return Object.keys(m).length ? m : undefined
}

const importTarget = computed((): ImportTarget | null => {
  if (targetMode.value === 'new_project') {
    const name = newProjectName.value.trim()
    if (!name) return null
    return { mode: 'new_project', newProjectName: name }
  }
  if (targetMode.value === 'project') {
    if (!projectId.value) return null
    return { mode: 'project', projectId: projectId.value }
  }
  return { mode: 'workspace' }
})

const needsColumnMapping = computed(() => {
  if (!headerList.value.length) return false
  if (missingCols.value.length) return true
  return headerList.value.some((h) => headerNeedsManualMapping(h, columnMap.value))
})

const missingCols = computed(() =>
  headerList.value.length ? missingRequiredColumns(headerList.value, columnMap.value) : [],
)

function parseHeadersFromCsv(text: string) {
  const line = text.trim().split(/\r?\n/).find(Boolean)
  if (!line) {
    headerList.value = []
    return
  }
  const delim = line.split(';').length > line.split(',').length ? ';' : ','
  headerList.value = line
    .split(delim)
    .map((h) => h.trim().replace(/^"|"$/g, ''))
    .filter(Boolean)
  applySuggestedMapping()
}

watch(csvText, parseHeadersFromCsv)

async function onCsvFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  csvFileLabel.value = file.name
  csvText.value = await file.text()
}

function pickCsvFile() {
  csvFileInput.value?.click()
}

function pickZipFile() {
  zipFileInput.value?.click()
}

function onZipChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  zipFile.value = file
}

async function readFileAsBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function validateBeforePreview(): string | null {
  if (!importTarget.value) {
    if (targetMode.value === 'new_project') return t('import.errors.needProjectName')
    if (targetMode.value === 'project') return t('import.errors.needProjectFocus')
    return t('import.errors.invalidTarget')
  }
  if (uploadKind.value === 'zip' && !zipFile.value) return t('import.errors.noZip')
  if (uploadKind.value === 'csv' && !csvText.value.trim()) return t('import.errors.noFile')
  if (needsColumnMapping.value && missingCols.value.length) {
    return t('import.errors.missingColumns', { cols: missingCols.value.join(', ') })
  }
  return null
}

async function runPreview() {
  errorMessage.value = ''
  const validation = validateBeforePreview()
  if (validation) {
    errorMessage.value = validation
    return
  }

  pending.value = true
  try {
    const body: Record<string, unknown> = {
      target: importTarget.value!,
      columnMap: columnMapForApi(),
    }
    if (uploadKind.value === 'zip' && zipFile.value) {
      body.zipBase64 = await readFileAsBase64(zipFile.value)
    } else {
      body.csv = csvText.value
    }
    const res = await $fetch('/api/import/preview', { method: 'POST', body })
    previewResult.value = res as typeof previewResult.value
    if (res && typeof res === 'object' && 'expectedHeaders' in res) {
      headerList.value = (res as { expectedHeaders: string[] }).expectedHeaders
    }
    resolutions.value = {}
    for (const d of previewResult.value?.duplicates ?? []) {
      resolutions.value[d.id] = 'skip'
    }
    step.value = 'review'
  } catch (e: unknown) {
    errorMessage.value = formatApiError(e)
  } finally {
    pending.value = false
  }
}

async function runCommit() {
  if (!previewResult.value) return
  errorMessage.value = ''
  const unresolved = previewResult.value.duplicates.filter((d) => !resolutions.value[d.id])
  if (unresolved.length) {
    errorMessage.value = t('import.errors.unresolvedDuplicates')
    return
  }
  pending.value = true
  try {
    const res = await $fetch<{ batchId: string }>('/api/import/commit', {
      method: 'POST',
      body: {
        previewId: previewResult.value.previewId,
        resolutions: Object.entries(resolutions.value).map(([duplicateId, action]) => ({
          duplicateId,
          action,
        })),
      },
    })
    batchId.value = res.batchId
    step.value = 'done'
  } catch (e: unknown) {
    errorMessage.value = formatApiError(e)
  } finally {
    pending.value = false
  }
}

async function revertBatch() {
  if (!batchId.value) return
  try {
    await $fetch(`/api/import/${batchId.value}/revert`, { method: 'POST' })
    batchId.value = ''
    errorMessage.value = ''
  } catch (e: unknown) {
    errorMessage.value = formatApiError(e)
    return
  }
  step.value = 'prepare'
}

function rowIssueLabel(code: string) {
  const key = `import.rowErrorCodes.${code}` as const
  const msg = t(key)
  return msg === key ? code : msg
}

function backToPrepare() {
  step.value = 'prepare'
  errorMessage.value = ''
}

const exportHref = computed(() =>
  projectId.value ? `/api/export/inventory?projectId=${projectId.value}` : '/api/export/inventory',
)
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-4">
      <div class="space-y-2">
        <h1 class="page-title">{{ t('import.title') }}</h1>
        <p class="text-sm text-muted">{{ t('import.lede') }}</p>
        <ProjectScopeBanner />
      </div>

      <AppCallout v-if="step === 'prepare'" variant="info" :title="t('import.getFileTitle')">
        {{ t('import.getFileBody') }}
        <template #actions>
          <a href="/api/import/template" class="btn-secondary text-sm">{{ t('import.downloadTemplate') }}</a>
          <a :href="exportHref" class="btn-secondary text-sm">{{ t('import.downloadExport') }}</a>
          <button type="button" class="btn-secondary text-sm" @click="sourceGuideOpen = true">
            {{ t('import.exportGuidesButton') }}
          </button>
        </template>
      </AppCallout>
    </header>

    <ImportSourceGuideDialog v-model:open="sourceGuideOpen" />

    <nav class="flex flex-wrap gap-2 text-sm" aria-label="Import progress">
      <span class="rounded-full px-3 py-1" :class="step === 'prepare' ? 'bg-stone-200 dark:bg-stone-700 font-medium text-ink' : 'text-muted'">
        1. {{ t('import.steps.prepare') }}
      </span>
      <span class="rounded-full px-3 py-1" :class="step === 'review' ? 'bg-stone-200 dark:bg-stone-700 font-medium text-ink' : 'text-muted'">
        2. {{ t('import.steps.preview') }}
      </span>
      <span class="rounded-full px-3 py-1" :class="step === 'done' ? 'bg-stone-200 dark:bg-stone-700 font-medium text-ink' : 'text-muted'">
        3. {{ t('import.steps.done') }}
      </span>
    </nav>

    <AppCallout v-if="errorMessage" variant="warning" role="alert">
      {{ errorMessage }}
    </AppCallout>

    <section v-if="step === 'prepare'" class="card space-y-6 p-5">
      <fieldset class="space-y-3">
        <legend class="text-sm font-semibold text-ink">{{ t('import.targetTitle') }}</legend>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="targetMode" type="radio" value="workspace" />
          {{ t('import.targetWorkspace') }}
        </label>
        <label v-if="projectId" class="flex items-center gap-2 text-sm">
          <input v-model="targetMode" type="radio" value="project" />
          {{ t('import.targetFocusedProject') }}
        </label>
        <label class="flex flex-wrap items-center gap-2 text-sm">
          <input v-model="targetMode" type="radio" value="new_project" />
          {{ t('import.targetNewProject') }}
          <input
            v-if="targetMode === 'new_project'"
            v-model="newProjectName"
            class="field w-full max-w-xs"
            :placeholder="t('import.newProjectPlaceholder')"
            required
          />
        </label>
        <p
          v-if="targetMode === 'new_project' && newProjectName.trim()"
          class="text-xs text-muted"
        >
          {{ t('import.targetNewProjectHint', { name: newProjectName.trim() }) }}
        </p>
        <p v-else-if="targetMode === 'project' && focusedProjectName" class="text-xs text-muted">
          {{ t('import.targetFocusedProjectHint', { name: focusedProjectName }) }}
        </p>
      </fieldset>

      <div class="space-y-3 border-t border-rule-light pt-5">
        <h2 class="text-sm font-semibold text-ink">{{ t('import.fileTitle') }}</h2>
        <div class="flex flex-wrap gap-3">
          <label class="text-sm">
            <input v-model="uploadKind" type="radio" value="csv" class="mr-1" />
            CSV
          </label>
          <label class="text-sm">
            <input v-model="uploadKind" type="radio" value="zip" class="mr-1" />
            ZIP {{ t('import.fileBundleHint') }}
          </label>
        </div>

        <template v-if="uploadKind === 'csv'">
          <input
            ref="csvFileInput"
            type="file"
            accept=".csv,text/csv"
            class="sr-only"
            @change="onCsvFileChange"
          />
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn-secondary text-sm" @click="pickCsvFile">
              {{ t('import.chooseCsvFile') }}
            </button>
            <span v-if="csvFileLabel" class="text-sm text-muted">{{ csvFileLabel }}</span>
          </div>
          <textarea
            v-model="csvText"
            rows="6"
            spellcheck="false"
            class="field font-mono text-xs"
            :placeholder="t('import.csvPlaceholder')"
          />
        </template>
        <template v-else>
          <input
            ref="zipFileInput"
            type="file"
            accept=".zip,application/zip"
            class="sr-only"
            @change="onZipChange"
          />
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn-secondary text-sm" @click="pickZipFile">
              {{ t('import.chooseZipFile') }}
            </button>
            <span v-if="zipFile" class="text-sm text-muted">{{ zipFile.name }}</span>
          </div>
        </template>
      </div>

      <div v-if="needsColumnMapping && headerList.length" class="space-y-3 border-t border-rule-light pt-5">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold text-ink">{{ t('import.columnMapTitle') }}</h2>
            <p class="text-xs text-muted">{{ t('import.columnMapHint') }}</p>
          </div>
          <button type="button" class="btn-secondary text-xs" @click="applySuggestedMapping">
            {{ t('import.applySuggestedMap') }}
          </button>
        </div>
        <p v-if="missingCols.length" class="text-sm text-amber-800 dark:text-amber-300">
          {{ t('import.errors.missingColumns', { cols: missingCols.join(', ') }) }}
        </p>
        <ul class="space-y-2">
          <li v-for="srcCol in headerList" :key="srcCol" class="flex flex-wrap items-center gap-2 text-sm">
            <span class="min-w-[6rem] font-mono text-xs">{{ srcCol }}</span>
            <span aria-hidden="true" class="text-subtle">→</span>
            <select v-model="columnMap[srcCol]" class="field w-full max-w-xs text-sm">
              <option value="">{{ t('import.columnSkip') }}</option>
              <option v-for="h in canonHeaders" :key="h" :value="h">{{ h }}</option>
            </select>
          </li>
        </ul>
      </div>

      <div class="flex flex-wrap gap-2 border-t border-rule-light pt-5">
        <button type="button" class="btn-primary" :disabled="pending" @click="runPreview">
          {{ t('import.preview') }}
        </button>
      </div>
    </section>

    <section v-else-if="step === 'review' && previewResult" class="card space-y-4 p-5">
      <AppCallout v-if="!previewResult.ok" variant="warning" :title="t('import.previewBlockedTitle')">
        {{ t('import.previewBlockedHint') }}
      </AppCallout>

      <p class="text-sm text-muted">
        {{ t('import.summaryLine', previewResult.summary) }}
      </p>

      <div v-if="previewResult.intraBatchDuplicates.length" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/40">
        <p class="font-medium">{{ t('import.intraBatchTitle') }}</p>
        <p class="mt-1 font-mono text-xs">{{ previewResult.intraBatchDuplicates.join(', ') }}</p>
      </div>

      <div v-if="previewResult.errors.length" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
        <p class="font-medium text-ink">{{ t('import.rowErrors') }}</p>
        <ul class="mt-2 max-h-48 overflow-auto text-xs">
          <li v-for="err in previewResult.errors" :key="`${err.rowIndex}-${err.message}`">
            {{ t('import.rowError', { row: err.rowIndex + 2, code: rowIssueLabel(err.message) }) }}
          </li>
        </ul>
      </div>

      <div v-if="previewResult.warnings?.length" class="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/40">
        <p class="font-medium text-ink">{{ t('import.rowWarnings') }}</p>
        <ul class="mt-2 max-h-48 overflow-auto text-xs">
          <li v-for="w in previewResult.warnings" :key="`w-${w.rowIndex}-${w.message}`">
            {{ t('import.rowError', { row: w.rowIndex + 2, code: rowIssueLabel(w.message) }) }}
          </li>
        </ul>
      </div>

      <div v-if="previewResult.duplicates.length" class="space-y-3">
        <h3 class="text-sm font-semibold text-ink">{{ t('import.duplicatesTitle') }}</h3>
        <article
          v-for="dup in previewResult.duplicates"
          :key="dup.id"
          class="rounded-lg border border-rule p-3 text-sm"
        >
          <p class="font-medium text-ink">{{ t('import.duplicateRow', { row: dup.rowIndex + 2, name: dup.existingName }) }}</p>
          <select v-model="resolutions[dup.id]" class="field mt-2 w-full max-w-xs text-sm">
            <option value="skip">{{ t('import.resolution.skip') }}</option>
            <option value="merge">{{ t('import.resolution.merge') }}</option>
            <option value="duplicate">{{ t('import.resolution.duplicate') }}</option>
          </select>
          <ul v-if="dup.mergeDiff && resolutions[dup.id] === 'merge'" class="mt-2 space-y-1 font-mono text-xs text-muted">
            <li v-for="(diff, field) in dup.mergeDiff" :key="field">
              {{ field }}: {{ diff.from ?? '—' }} → {{ diff.to }}
            </li>
          </ul>
        </article>
      </div>

      <div v-if="previewResult.previewRows.length" class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-rule text-xs uppercase text-subtle">
              <th class="py-2 pr-2">#</th>
              <th class="py-2 pr-2">{{ t('import.colProject') }}</th>
              <th class="py-2 pr-2">{{ t('import.colName') }}</th>
              <th class="py-2 pr-2">{{ t('import.colProvider') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in previewResult.previewRows" :key="row.rowIndex" class="border-b border-rule-light">
              <td class="py-1.5 pr-2 font-mono text-xs">{{ Number(row.rowIndex) + 2 }}</td>
              <td class="py-1.5 pr-2">{{ row.project }}</td>
              <td class="py-1.5 pr-2">{{ row.asset_name }}</td>
              <td class="py-1.5 pr-2">{{ row.provider }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary" @click="backToPrepare">{{ t('import.back') }}</button>
        <button
          type="button"
          class="btn-primary"
          :disabled="pending || !previewResult.ok"
          @click="runCommit"
        >
          {{ t('import.commit') }}
        </button>
      </div>
    </section>

    <section v-else-if="step === 'done'" class="card space-y-4 p-5">
      <AppCallout variant="info" :title="t('import.doneTitle')">
        {{ t('import.commitSuccess', { id: batchId }) }}
      </AppCallout>
      <div class="flex flex-wrap gap-2">
        <button v-if="batchId" type="button" class="btn-danger" @click="revertBatch">{{ t('import.revert') }}</button>
        <NuxtLink to="/assets" class="btn-secondary text-sm">{{ t('nav.assets') }}</NuxtLink>
        <button type="button" class="btn-secondary text-sm" @click="backToPrepare">{{ t('import.importAnother') }}</button>
      </div>
    </section>
  </div>
</template>
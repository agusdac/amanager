<script setup lang="ts">
import { ASSET_TYPE_KEYS } from '~/constants/inventory'
import {
  WORKSPACE_INVENTORY_GENERATORS,
  generatorDefaultTargetType,
  generatorSupportsSpecificTarget,
  inventoryGeneratorNeedsAssetType,
  type InventoryTargetType,
  type WorkspaceInventoryGenerator,
} from '~/constants/runbookInventoryGenerators'
import { RUNBOOK_STEP_KINDS } from '#shared/schemas/runbooks'
import {
  WORKSPACE_TEMPLATE_PATTERN_IDS,
  HILKO_MARKDOWN_SNIPPETS,
  buildWorkspacePattern,
  emptyWorkspaceStep,
  hilkoSnippetMarkdown,
  type WorkspaceStepDraft,
  type WorkspaceTemplatePatternId,
} from '~/constants/workspaceTemplatePatterns'
import { workspaceStepToPayload } from '#shared/runbooks/workspaceStepPayload'

type StepKind = (typeof RUNBOOK_STEP_KINDS)[number]
type StepRisk = 'low' | 'medium' | 'high'

const STEP_RISKS: StepRisk[] = ['low', 'medium', 'high']

const pickerOpen = ref(false)
const pickerStepIndex = ref(0)
const pickerTargetType = ref<InventoryTargetType>('asset')

const deleteOpen = ref(false)
const deleting = ref(false)

async function deleteTemplate() {
  if (!editSlug.value) return
  deleting.value = true
  try {
    await $fetch(`/api/runbook-templates/${editSlug.value}`, { method: 'DELETE' })
    await router.push('/guides')
  } catch (e: unknown) {
    error.value = (e as { statusMessage?: string })?.statusMessage ?? t('common.errorGeneric')
  } finally {
    deleting.value = false
    deleteOpen.value = false
  }
}

function openReferencePicker(index: number) {
  const step = steps.value[index]
  if (!step) return
  const inferred = generatorDefaultTargetType(step.inventoryGenerator)
  if (!inferred) return
  pickerStepIndex.value = index
  pickerTargetType.value = (step.inventoryTargetType || inferred) as InventoryTargetType
  pickerOpen.value = true
}

function onReferencePicked(payload: { id: string; label: string }) {
  const step = steps.value[pickerStepIndex.value]
  if (!step) return
  step.inventoryTargetId = payload.id
  step.inventoryTargetLabel = payload.label
  step.inventoryTargetType = pickerTargetType.value
  step.inventoryScope = 'specific'
}

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const editSlug = computed(() => (typeof route.query.slug === 'string' ? route.query.slug : ''))
const isEdit = computed(() => editSlug.value.length > 0)

useAppPageTitle(computed(() => (isEdit.value ? 'pageTitles.guidesTemplateEdit' : 'pageTitles.guidesTemplateNew')))

const title = ref('')
const contentMarkdown = ref('')
const requiresEnvironment = ref(false)
const steps = ref<WorkspaceStepDraft[]>([emptyWorkspaceStep()])
const error = ref('')
const saving = ref(false)
const hydrated = ref(false)

const existing = ref<{ template: Record<string, unknown> } | null>(null)
const loadingExisting = ref(false)

const previewProjectId = ref('')
const { data: projects } = await useFetch('/api/projects')

type StepPreview = { bodyMarkdown: string; pending: boolean; sample: boolean }
const stepPreviews = ref<Record<number, StepPreview | null>>({})
const stepPreviewLoading = ref<Record<number, boolean>>({})

async function refreshStepPreview(index: number) {
  const step = steps.value[index]
  if (!step?.title.trim()) {
    stepPreviews.value[index] = null
    return
  }
  stepPreviewLoading.value[index] = true
  try {
    stepPreviews.value[index] = await $fetch<StepPreview>('/api/runbook-templates/preview', {
      method: 'POST',
      body: {
        step: workspaceStepToPayload(step),
        stepIndex: index,
        projectId: previewProjectId.value || undefined,
        locale: locale.value === 'es' ? 'es' : 'en',
      },
    })
  } catch {
    stepPreviews.value[index] = null
  } finally {
    stepPreviewLoading.value[index] = false
  }
}

let previewTimer: ReturnType<typeof setTimeout> | undefined
watch(
  [steps, previewProjectId],
  () => {
    clearTimeout(previewTimer)
    previewTimer = setTimeout(() => {
      steps.value.forEach((step, index) => {
        if (step.stepSource === 'inventory' && step.title.trim()) refreshStepPreview(index)
        else stepPreviews.value[index] = null
      })
    }, 450)
  },
  { deep: true },
)

function stepFromOutline(
  s: {
    title: string
    bodyMarkdown?: string | null
    kind?: string
    risk?: string
    generator?: string
    listGenerator?: string | null
    assetType?: string | null
    providerSlug?: string | null
    inventoryTargetType?: string | null
    inventoryTargetId?: string | null
    inventoryTargetLabel?: string | null
    inventoryScope?: 'all' | 'specific'
    dependsOn?: string[]
    key?: string
  },
  index: number,
): WorkspaceStepDraft {
  const gen = s.generator ?? 'static_markdown'
  const isSpecific = gen === 'specific_reference'
  const isInventory = gen !== 'static_markdown'
  const listGen = isSpecific
    ? (s.listGenerator as WorkspaceInventoryGenerator) || 'inventory_overview'
    : WORKSPACE_INVENTORY_GENERATORS.includes(gen as WorkspaceInventoryGenerator)
      ? (gen as WorkspaceInventoryGenerator)
      : 'inventory_overview'
  const dependsOnStepIndexes = (s.dependsOn ?? [])
    .map((dep) => Number.parseInt(dep.replace(/^step-/, ''), 10) - 1)
    .filter((n) => Number.isFinite(n) && n >= 0 && n < index)
  return {
    title: s.title,
    stepSource: isInventory ? 'inventory' : 'markdown',
    inventoryGenerator: isInventory ? listGen : 'inventory_overview',
    inventoryScope: isSpecific || s.inventoryScope === 'specific' ? 'specific' : 'all',
    inventoryTargetType: (s.inventoryTargetType as InventoryTargetType) ?? '',
    inventoryTargetId: s.inventoryTargetId ?? '',
    inventoryTargetLabel: s.inventoryTargetLabel ?? '',
    assetType: s.assetType ?? 'repository',
    providerSlug: s.providerSlug ?? '',
    bodyMarkdown: s.bodyMarkdown ?? '',
    kind: (s.kind as StepKind) || 'manual',
    risk: (s.risk as StepRisk) || 'low',
    dependsOnStepIndexes,
  }
}

function hydrateFromTemplate(tpl: NonNullable<typeof existing.value>['template']) {
  const t = tpl as {
    scope?: string
    title?: string
    description?: string | null
    requiredInputs?: string[]
    stepsOutline?: Array<Parameters<typeof stepFromOutline>[0]>
  }
  if (t.scope !== 'workspace') return
  title.value = t.title ?? ''
  contentMarkdown.value = t.description ?? ''
  requiresEnvironment.value = t.requiredInputs?.includes('environmentId') ?? false
  const outline = t.stepsOutline ?? []
  steps.value = outline.length > 0 ? outline.map((s, i) => stepFromOutline(s, i)) : [emptyWorkspaceStep()]
  hydrated.value = true
}

watch(
  editSlug,
  async (slug) => {
    hydrated.value = false
    existing.value = null
    if (!slug) {
      if (!isEdit.value) hydrated.value = true
      return
    }
    loadingExisting.value = true
    try {
      existing.value = await $fetch(`/api/runbook-templates/${slug}`)
      if (existing.value?.template) hydrateFromTemplate(existing.value.template)
    } catch {
      existing.value = null
    } finally {
      loadingExisting.value = false
    }
  },
  { immediate: true },
)

function addStep() {
  steps.value.push(emptyWorkspaceStep())
}

function insertPattern(patternId: WorkspaceTemplatePatternId) {
  const base = steps.value.length
  const added = buildWorkspacePattern(patternId, t)
  for (let i = 0; i < added.length; i++) {
    const s = { ...added[i] }
    s.dependsOnStepIndexes = i > 0 ? [base + i - 1] : []
    steps.value.push(s)
  }
  for (let i = base; i < steps.value.length; i++) {
    const s = steps.value[i]
    if (s?.stepSource === 'inventory' && s.inventoryScope === 'specific' && !s.inventoryTargetId) {
      openReferencePicker(i)
      break
    }
  }
}

function appendSnippet(stepIndex: number, snippetId: (typeof HILKO_MARKDOWN_SNIPPETS)[number]['id']) {
  const step = steps.value[stepIndex]
  if (!step) return
  const snippet = hilkoSnippetMarkdown(snippetId, t)
  const gap = step.bodyMarkdown.trim() ? '\n\n' : ''
  step.bodyMarkdown = `${step.bodyMarkdown.trim()}${gap}${snippet}`
}

function removeStep(index: number) {
  if (steps.value.length <= 1) return
  steps.value.splice(index, 1)
}

function moveStep(index: number, dir: -1 | 1) {
  const next = index + dir
  if (next < 0 || next >= steps.value.length) return
  const copy = [...steps.value]
  const [row] = copy.splice(index, 1)
  copy.splice(next, 0, row)
  steps.value = copy
}

function toggleDepends(stepIndex: number, priorIndex: number) {
  const step = steps.value[stepIndex]
  if (!step || priorIndex >= stepIndex) return
  const set = new Set(step.dependsOnStepIndexes)
  if (set.has(priorIndex)) set.delete(priorIndex)
  else set.add(priorIndex)
  step.dependsOnStepIndexes = [...set].sort((a, b) => a - b)
}

function priorSteps(index: number) {
  return Array.from({ length: index }, (_, i) => i)
}

async function save() {
  error.value = ''
  const trimmedSteps = steps.value.filter((s) => s.title.trim())
  if (!title.value.trim() || trimmedSteps.length === 0) {
    error.value = t('guides.templates.workspaceMissingFields')
    return
  }
  for (const s of trimmedSteps) {
    if (s.stepSource === 'inventory' && inventoryGeneratorNeedsAssetType(s.inventoryGenerator) && !s.assetType) {
      error.value = t('guides.templates.workspaceMissingAssetType')
      return
    }
    if (s.stepSource === 'inventory' && s.inventoryScope === 'specific' && !s.inventoryTargetId) {
      error.value = t('guides.templates.workspaceMissingTarget')
      return
    }
  }
  saving.value = true
  try {
    const body = {
      title: title.value.trim(),
      contentMarkdown: contentMarkdown.value.trim() || undefined,
      requiresEnvironment: requiresEnvironment.value,
      steps: trimmedSteps.map((s) => workspaceStepToPayload(s)),
    }
    const res = isEdit.value
      ? await $fetch<{ template: { slug: string } }>(`/api/runbook-templates/${editSlug.value}`, {
          method: 'PATCH',
          body,
        })
      : await $fetch<{ template: { slug: string } }>('/api/runbook-templates', { method: 'POST', body })
    await router.push(`/guides/templates/${res.template.slug}`)
  } catch (e: unknown) {
    error.value = (e as { statusMessage?: string })?.statusMessage ?? t('common.errorGeneric')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <p class="text-sm">
      <NuxtLink to="/guides" class="text-muted underline">{{ t('guides.templates.backToGuides') }}</NuxtLink>
    </p>

    <div v-if="isEdit && loadingExisting" class="text-sm text-subtle">{{ t('common.loading') }}</div>

    <p v-else-if="isEdit && !hydrated" class="text-sm text-muted">{{ t('guides.templates.notFound') }}</p>

    <template v-else-if="!isEdit || hydrated">
      <h1 class="page-title">
        {{ isEdit ? t('guides.templates.workspaceEditTitle') : t('guides.templates.workspaceNewTitle') }}
      </h1>
      <p class="lede">{{ t('guides.templates.workspaceSubtitle') }}</p>
      <p class="text-sm text-muted">{{ t('guides.templates.workspaceHintBody') }}</p>

      <form class="card space-y-5 p-5" @submit.prevent="save">
        <label class="block text-sm">
          <span class="font-medium text-ink-secondary">{{ t('guides.fieldTitle') }}</span>
          <input v-model="title" type="text" class="field mt-1.5 w-full" required />
        </label>

        <label class="block text-sm">
          <span class="font-medium text-ink-secondary">{{ t('guides.templates.workspaceOverview') }}</span>
          <textarea v-model="contentMarkdown" rows="3" class="field mt-1.5 w-full font-mono text-sm" />
        </label>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="requiresEnvironment" type="checkbox" class="checkbox" />
          {{ t('guides.templates.workspaceRequiresEnv') }}
        </label>

        <label class="block text-sm">
          <span class="font-medium text-ink-secondary">{{ t('guides.templates.previewProject') }}</span>
          <select v-model="previewProjectId" class="field mt-1.5 w-full">
            <option value="">{{ t('guides.templates.previewSampleProject') }}</option>
            <option v-for="p in projects?.projects ?? []" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <span class="mt-1 block text-xs text-subtle">{{ t('guides.templates.previewProjectHint') }}</span>
        </label>

        <section class="rounded-xl border border-dashed border-stone-300 dark:border-stone-600 bg-surface p-4">
          <h2 class="text-sm font-medium text-ink">{{ t('guides.templates.workflowPatternsTitle') }}</h2>
          <p class="mt-1 text-xs text-muted">{{ t('guides.templates.workflowPatternsHint') }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="pid in WORKSPACE_TEMPLATE_PATTERN_IDS"
              :key="pid"
              type="button"
              class="btn-secondary text-xs"
              @click="insertPattern(pid)"
            >
              {{ t(`guides.templates.patternIds.${pid}`) }}
            </button>
          </div>
        </section>

        <div class="space-y-4">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="rounded-xl border border-rule bg-stone-50/60 dark:bg-stone-900/70 dark:bg-stone-900/70 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase tracking-wide text-subtle">
                {{ t('guides.templates.workspaceStepLabel', { n: index + 1 }) }}
              </span>
              <div class="flex gap-1">
                <button type="button" class="btn-secondary px-2 py-0.5 text-xs" :disabled="index === 0" @click="moveStep(index, -1)">↑</button>
                <button
                  type="button"
                  class="btn-secondary px-2 py-0.5 text-xs"
                  :disabled="index === steps.length - 1"
                  @click="moveStep(index, 1)"
                >
                  ↓
                </button>
                <button type="button" class="btn-secondary px-2 py-0.5 text-xs" :disabled="steps.length <= 1" @click="removeStep(index)">
                  {{ t('common.remove') }}
                </button>
              </div>
            </div>

            <input
              v-model="step.title"
              type="text"
              class="field mt-3 w-full text-sm"
              :placeholder="t('guides.templates.workspaceStepTitlePh')"
            />

            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label class="block text-xs">
                <span class="font-medium text-muted">{{ t('guides.templates.stepKind') }}</span>
                <select v-model="step.kind" class="field mt-1 w-full text-sm">
                  <option v-for="k in RUNBOOK_STEP_KINDS" :key="k" :value="k">
                    {{ t(`guides.stepKinds.${k}`) }}
                  </option>
                </select>
              </label>
              <label class="block text-xs">
                <span class="font-medium text-muted">{{ t('guides.templates.stepRisk') }}</span>
                <select v-model="step.risk" class="field mt-1 w-full text-sm">
                  <option v-for="r in STEP_RISKS" :key="r" :value="r">
                    {{ t(`guides.stepRisks.${r}`) }}
                  </option>
                </select>
              </label>
            </div>

            <label class="mt-3 block text-xs font-medium text-muted">{{ t('guides.templates.workspaceStepSource') }}</label>
            <select v-model="step.stepSource" class="field mt-1 w-full text-sm">
              <option value="markdown">{{ t('guides.templates.workspaceSourceMarkdown') }}</option>
              <option value="inventory">{{ t('guides.templates.workspaceSourceInventory') }}</option>
            </select>

            <template v-if="step.stepSource === 'inventory'">
              <label class="mt-3 block text-xs font-medium text-muted">{{ t('guides.templates.workspaceInventoryKind') }}</label>
              <select
                v-model="step.inventoryGenerator"
                class="field mt-1 w-full text-sm"
                @change="
                  () => {
                    if (!generatorSupportsSpecificTarget(step.inventoryGenerator)) step.inventoryScope = 'all'
                  }
                "
              >
                <option v-for="gen in WORKSPACE_INVENTORY_GENERATORS" :key="gen" :value="gen">
                  {{ t(`guides.templates.inventoryGenerators.${gen}`) }}
                </option>
              </select>

              <div v-if="generatorSupportsSpecificTarget(step.inventoryGenerator)" class="mt-3 space-y-2">
                <span class="text-xs font-medium text-muted">{{ t('guides.templates.inventoryScope') }}</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-full border px-3 py-1 text-xs"
                    :class="step.inventoryScope === 'all' ? 'border-stone-800 bg-stone-900 text-white' : 'border-stone-300 dark:border-stone-600 bg-surface'"
                    @click="step.inventoryScope = 'all'"
                  >
                    {{ t('guides.templates.inventoryScopeAll') }}
                  </button>
                  <button
                    type="button"
                    class="rounded-full border px-3 py-1 text-xs"
                    :class="step.inventoryScope === 'specific' ? 'border-stone-800 bg-stone-900 text-white' : 'border-stone-300 dark:border-stone-600 bg-surface'"
                    @click="step.inventoryScope = 'specific'"
                  >
                    {{ t('guides.templates.inventoryScopeSpecific') }}
                  </button>
                </div>
                <div v-if="step.inventoryScope === 'specific'" class="flex flex-wrap items-center gap-2">
                  <span v-if="step.inventoryTargetLabel" class="text-sm text-ink">{{ step.inventoryTargetLabel }}</span>
                  <span v-else class="text-sm text-subtle">{{ t('guides.templates.noTargetSelected') }}</span>
                  <button type="button" class="btn-secondary text-xs" @click="openReferencePicker(index)">
                    {{ t('guides.templates.pickReference') }}
                  </button>
                  <button
                    v-if="step.inventoryTargetId"
                    type="button"
                    class="text-xs text-subtle underline"
                    @click="
                      () => {
                        step.inventoryTargetId = ''
                        step.inventoryTargetLabel = ''
                      }
                    "
                  >
                    {{ t('common.clear') }}
                  </button>
                </div>
              </div>

              <div v-if="inventoryGeneratorNeedsAssetType(step.inventoryGenerator) && step.inventoryScope === 'all'" class="mt-3 grid gap-3 sm:grid-cols-2">
                <label class="block text-xs">
                  <span class="font-medium text-muted">{{ t('guides.templates.workspaceAssetType') }}</span>
                  <select v-model="step.assetType" class="field mt-1 w-full text-sm">
                    <option v-for="atype in ASSET_TYPE_KEYS" :key="atype" :value="atype">{{ atype }}</option>
                  </select>
                </label>
                <label class="block text-xs">
                  <span class="font-medium text-muted">{{ t('guides.templates.workspaceProviderSlug') }}</span>
                  <input v-model="step.providerSlug" type="text" class="field mt-1 w-full text-sm" :placeholder="t('guides.templates.workspaceProviderOptional')" />
                </label>
              </div>

              <label class="mt-3 block text-xs font-medium text-muted">{{ t('guides.templates.workspaceInventoryIntro') }}</label>
              <textarea
                v-model="step.bodyMarkdown"
                rows="2"
                class="field mt-1 w-full font-mono text-sm"
                :placeholder="t('guides.templates.workspaceInventoryIntroPh')"
              />
            </template>

            <template v-else>
              <textarea
                v-model="step.bodyMarkdown"
                rows="4"
                class="field mt-3 w-full font-mono text-sm"
                :placeholder="t('guides.templates.workspaceStepBodyPh')"
              />
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span class="text-xs text-subtle">{{ t('guides.templates.insertLink') }}:</span>
                <button
                  v-for="snip in HILKO_MARKDOWN_SNIPPETS"
                  :key="snip.id"
                  type="button"
                  class="rounded border border-rule bg-surface px-2 py-0.5 text-xs text-ink-secondary hover:bg-surface-muted"
                  @click="appendSnippet(index, snip.id)"
                >
                  {{ t(snip.labelKey) }}
                </button>
              </div>
              <div v-if="step.bodyMarkdown.trim()" class="mt-3 rounded-lg border border-rule bg-surface p-3">
                <p class="text-xs font-medium uppercase tracking-wide text-subtle">{{ t('guides.templates.stepPreview') }}</p>
                <AppMarkdownPreview class="mt-2 text-sm" :markdown="step.bodyMarkdown" />
              </div>
            </template>

            <div
              v-if="step.stepSource === 'inventory' && step.title.trim()"
              class="mt-3 rounded-lg border border-rule bg-surface p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-xs font-medium uppercase tracking-wide text-subtle">{{ t('guides.templates.stepPreview') }}</p>
                <span v-if="stepPreviewLoading[index]" class="text-xs text-subtle">{{ t('common.loading') }}</span>
                <span
                  v-else-if="stepPreviews[index]?.sample"
                  class="badge-amber"
                >
                  {{ t('guides.templates.previewSampleBadge') }}
                </span>
                <span
                  v-else-if="stepPreviews[index]"
                  class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-900"
                >
                  {{ t('guides.templates.previewLiveBadge') }}
                </span>
              </div>
              <AppMarkdownPreview
                v-if="stepPreviews[index]?.bodyMarkdown"
                class="mt-2 text-sm"
                :markdown="stepPreviews[index]!.bodyMarkdown"
              />
              <p v-else-if="!stepPreviewLoading[index]" class="mt-2 text-xs text-subtle">
                {{ t('guides.templates.previewEmpty') }}
              </p>
            </div>

            <div v-if="index > 0" class="mt-3">
              <span class="text-xs font-medium text-muted">{{ t('guides.templates.workspaceDependsOn') }}</span>
              <ul class="mt-1 flex flex-wrap gap-2">
                <li v-for="prior in priorSteps(index)" :key="prior">
                  <button
                    type="button"
                    class="rounded-full border px-2 py-0.5 text-xs"
                    :class="
                      step.dependsOnStepIndexes.includes(prior)
                        ? 'border-stone-800 bg-stone-800 text-white'
                        : 'border-stone-300 dark:border-stone-600 bg-surface text-muted'
                    "
                    @click="toggleDepends(index, prior)"
                  >
                    {{ t('guides.templates.workspaceStepLabel', { n: prior + 1 }) }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <button type="button" class="btn-secondary text-sm" @click="addStep">
          {{ t('guides.templates.workspaceAddStep') }}
        </button>

        <p v-if="error" class="text-sm text-red-700">{{ error }}</p>

        <button type="submit" class="btn-primary w-full" :disabled="saving">
          {{ saving ? t('common.saving') : t('guides.templates.workspaceSave') }}
        </button>
      </form>

      <section v-if="isEdit" class="card border-red-100 bg-red-50/40 p-5">
        <h2 class="text-sm font-medium text-red-900">{{ t('guides.templates.deleteWorkspace') }}</h2>
        <p class="mt-1 text-sm text-red-800/90">{{ t('guides.templates.deleteWorkspaceDescription') }}</p>
        <button
          type="button"
          class="mt-3 rounded-lg border border-red-300 bg-surface px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
          @click="deleteOpen = true"
        >
          {{ t('guides.templates.deleteWorkspace') }}
        </button>
      </section>

      <AppConfirmDialog
        v-model:open="deleteOpen"
        variant="danger"
        :title="t('guides.templates.deleteWorkspaceTitle')"
        :description="t('guides.templates.deleteWorkspaceDescription')"
        :confirm-label="deleting ? t('common.loading') : t('guides.templates.deleteWorkspaceConfirm')"
        @confirm="deleteTemplate"
      />

      <InventoryReferencePickerDialog
        v-model:open="pickerOpen"
        :target-type="pickerTargetType"
        :project-id="previewProjectId || undefined"
        @select="onReferencePicked"
      />
    </template>
  </div>
</template>
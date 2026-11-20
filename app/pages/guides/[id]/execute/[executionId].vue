<script setup lang="ts">
import { stepStatusUi } from '~/constants/stepResultStatusUi'
import { STEP_RESULT_STATUSES } from '#shared/schemas/runbooks'

const { t } = useI18n()

function stepStatusLabel(status: string) {
  return t(`guides.stepStatus.${status}`)
}
const route = useRoute()
const runbookId = computed(() => String(route.params.id))
const executionId = computed(() => String(route.params.executionId))

useAppPageTitle('pageTitles.guidesExecution')

const { data, pending, refresh } = await useFetch(() => `/api/runbook-executions/${executionId.value}`, {
  watch: [executionId],
})

const noteByStep = ref<Record<string, string>>({})
const assigneeByStep = ref<Record<string, string | null>>({})
const updating = ref<string | null>(null)

watch(
  () => data.value?.steps,
  (steps) => {
    if (!steps) return
    for (const s of steps) {
      const refId = s.id
      if (s.result?.resultNote) noteByStep.value[refId] = s.result.resultNote
      assigneeByStep.value[refId] = s.assigneeUserId ?? null
    }
  },
  { immediate: true },
)

function stepRef(step: { id: string; binding?: string }) {
  return step.id
}

async function saveAssignee(step: { id: string; orphaned?: boolean }) {
  if (step.orphaned) return
  updating.value = step.id
  try {
    await $fetch(`/api/runbook-executions/${executionId.value}/steps/${stepRef(step)}`, {
      method: 'PATCH',
      body: { assigneeUserId: assigneeByStep.value[step.id] ?? null },
    })
    await refresh()
  } finally {
    updating.value = null
  }
}

async function patchStep(
  step: { id: string; orphaned?: boolean },
  status: (typeof STEP_RESULT_STATUSES)[number],
) {
  if (step.orphaned) return
  updating.value = step.id
  try {
    await $fetch(`/api/runbook-executions/${executionId.value}/steps/${stepRef(step)}`, {
      method: 'PATCH',
      body: { status, resultNote: noteByStep.value[step.id] || undefined },
    })
    await refresh()
  } finally {
    updating.value = null
  }
}

async function closeExecution(status: 'completed' | 'cancelled') {
  await $fetch(`/api/runbook-executions/${executionId.value}`, { method: 'PATCH', body: { status } })
  await navigateTo(`/guides/${runbookId.value}`)
}
</script>

<template>
  <div v-if="pending" class="text-sm text-subtle">{{ t('common.loading') }}</div>
  <div v-else-if="data" class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="page-title">{{ data.runbook?.title }}</h1>
        <p class="text-sm text-muted">
          {{
            t('guides.executionMode', {
              mode: t(`guides.contentBinding.${data.execution.contentBinding}`),
            })
          }}
          <span v-if="data.execution.status !== 'in_progress'" class="ml-2 font-medium">
            {{ t(`guides.executionStatus.${data.execution.status}`) }}
          </span>
        </p>
      </div>
      <div class="flex gap-2">
        <a
          v-if="data.execution.status === 'in_progress'"
          :href="`/api/runbook-executions/${executionId}/export.md`"
          class="btn-secondary text-sm"
          download
        >
          {{ t('guides.exportMd') }}
        </a>
        <button
          v-if="data.execution.status === 'in_progress'"
          type="button"
          class="btn-primary text-sm"
          @click="closeExecution('completed')"
        >
          {{ t('guides.completeExecution') }}
        </button>
        <button
          v-if="data.execution.status === 'in_progress'"
          type="button"
          class="btn-secondary text-sm"
          @click="closeExecution('cancelled')"
        >
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>

    <ol class="space-y-4">
      <li v-for="step in data.steps" :key="step.id" class="card p-4" :class="{ 'opacity-60': step.orphaned }">
        <h2 class="font-medium text-ink">{{ step.title }}</h2>
        <p v-if="step.updatedSinceStart" class="mt-1 text-xs text-amber-800">{{ t('guides.updatedSinceStart') }}</p>
        <p v-if="step.orphaned" class="mt-1 text-xs text-subtle">{{ t('guides.stepOrphaned') }}</p>
        <AppMarkdownPreview class="mt-2" :markdown="step.bodyMarkdown" />

        <div v-if="data.execution.status === 'in_progress' && !step.orphaned" class="mt-4 space-y-3">
          <p
            v-if="step.result"
            class="inline-flex items-center gap-2 text-sm font-medium"
          >
            <span class="text-subtle">{{ t('guides.currentStatus') }}</span>
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset"
              :class="stepStatusUi(step.result.status).badge"
            >
              {{ stepStatusLabel(step.result.status) }}
            </span>
          </p>
          <p v-else class="text-sm text-subtle">{{ t('guides.stepStatusUnset') }}</p>

          <textarea
            v-model="noteByStep[step.id]"
            rows="2"
            class="field w-full text-sm"
            :placeholder="t('guides.resultNotePlaceholder')"
          />
          <label class="block text-sm">
            <span class="label">{{ t('assignee.executionStep') }}</span>
            <WorkspaceMemberSelect
              :model-value="assigneeByStep[step.id] ?? null"
              @update:model-value="
                (v) => {
                  assigneeByStep[step.id] = v
                  saveAssignee(step)
                }
              "
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="st in STEP_RESULT_STATUSES"
              :key="st"
              type="button"
              class="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
              :class="
                step.result?.status === st
                  ? stepStatusUi(st).buttonActive
                  : stepStatusUi(st).button
              "
              :disabled="updating === step.id"
              @click="patchStep(step, st)"
            >
              {{ stepStatusLabel(st) }}
            </button>
          </div>
        </div>
        <p
          v-else-if="step.result && data.execution.status !== 'in_progress'"
          class="mt-3 inline-flex items-center gap-2 text-sm"
        >
          <span class="text-subtle">{{ t('guides.currentStatus') }}</span>
          <span
            class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset"
            :class="stepStatusUi(step.result.status).badge"
          >
            {{ stepStatusLabel(step.result.status) }}
          </span>
        </p>
      </li>
    </ol>

    <NuxtLink :to="`/guides/${runbookId}`" class="text-sm underline">{{ t('guides.backToRunbook') }}</NuxtLink>
  </div>
</template>
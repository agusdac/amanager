<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const id = computed(() => String(route.params.id))

useAppPageTitle('pageTitles.guidesDetail')

const { data, pending, refresh } = await useFetch(() => `/api/runbooks/${id.value}`, { watch: [id] })

const overview = ref('')
const savingOverview = ref(false)
const stepSaving = ref<string | null>(null)
const refreshDiff = ref<Array<{ stepKey: string; title: string; before: string; after: string }>>([])
const selectedMerge = ref<string[]>([])
const execLive = ref(false)
const execLoading = ref(false)
const execError = ref('')
const message = ref('')
const overviewPreview = ref(false)

watch(
  () => data.value?.runbook?.overviewMarkdown,
  (v) => {
    overview.value = v ?? ''
  },
  { immediate: true },
)

async function saveOverview() {
  savingOverview.value = true
  try {
    await $fetch(`/api/runbooks/${id.value}`, { method: 'PATCH', body: { overviewMarkdown: overview.value } })
    await refresh()
  } finally {
    savingOverview.value = false
  }
}

async function saveStep(
  stepId: string,
  payload: { title: string; bodyMarkdown: string; defaultAssigneeUserId?: string | null },
) {
  stepSaving.value = stepId
  try {
    await $fetch(`/api/runbooks/${id.value}/steps/${stepId}`, {
      method: 'PATCH',
      body: payload,
    })
    await refresh()
  } finally {
    stepSaving.value = null
  }
}

async function loadRefreshDiff() {
  const res = await $fetch<{ diff: typeof refreshDiff.value }>(`/api/runbooks/${id.value}/refresh-inventory`, {
    method: 'POST',
    body: {},
  })
  refreshDiff.value = res.diff
  selectedMerge.value = res.diff.map((d) => d.stepKey)
}

async function applyRefresh() {
  await $fetch(`/api/runbooks/${id.value}/refresh-inventory`, {
    method: 'POST',
    body: { acceptStepKeys: selectedMerge.value },
  })
  refreshDiff.value = []
  await refresh()
  message.value = t('guides.refreshApplied')
}

async function startExecution() {
  execError.value = ''
  execLoading.value = true
  try {
    const res = await $fetch<{ execution: { id: string } }>(`/api/runbooks/${id.value}/executions`, {
      method: 'POST',
      body: { contentBinding: execLive.value ? 'live' : 'snapshot' },
    })
    await navigateTo(`/guides/${id.value}/execute/${res.execution.id}`)
  } catch (e: unknown) {
    execError.value = (e as { statusMessage?: string })?.statusMessage ?? t('common.errorGeneric')
  } finally {
    execLoading.value = false
  }
}
</script>

<template>
  <div v-if="pending" class="text-sm text-subtle">{{ t('common.loading') }}</div>
  <div v-else-if="data?.runbook" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="page-title">{{ data.runbook.title }}</h1>
        <p class="text-sm text-muted">{{ data.runbook.templateSlug ?? t('guides.customRunbook') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a :href="`/api/runbooks/${id}/export.md`" class="btn-secondary text-sm" download>
          {{ t('guides.exportMd') }}
        </a>
        <button type="button" class="btn-primary text-sm" :disabled="execLoading" @click="startExecution">
          {{ t('guides.startExecution') }}
        </button>
      </div>
    </div>

    <label class="flex items-center gap-2 text-sm text-muted">
      <input v-model="execLive" type="checkbox" class="checkbox" />
      {{ t('guides.liveBinding') }}
    </label>

    <p v-if="execError" class="text-sm text-red-700">{{ execError }}</p>

    <section class="card space-y-3 p-5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-medium uppercase tracking-wide text-subtle">{{ t('guides.overview') }}</h2>
        <button type="button" class="text-xs underline" @click="overviewPreview = !overviewPreview">
          {{ overviewPreview ? t('guides.editMarkdown') : t('guides.previewMarkdown') }}
        </button>
      </div>
      <textarea v-if="!overviewPreview" v-model="overview" rows="5" class="field w-full font-mono text-sm" />
      <AppMarkdownPreview v-else :markdown="overview" />
      <button type="button" class="btn-secondary text-sm" :disabled="savingOverview" @click="saveOverview">
        {{ t('common.save') }}
      </button>
    </section>

    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-medium uppercase tracking-wide text-subtle">{{ t('guides.steps') }}</h2>
        <button type="button" class="btn-secondary text-sm" @click="loadRefreshDiff">{{ t('guides.refreshInventory') }}</button>
      </div>

      <div v-if="refreshDiff.length" class="card notice-wash space-y-3 p-4">
        <p class="notice-wash__text">{{ t('guides.refreshPreview') }}</p>
        <ul class="space-y-2 text-sm">
          <li v-for="d in refreshDiff" :key="d.stepKey" class="flex gap-2">
            <input v-model="selectedMerge" type="checkbox" class="checkbox" :value="d.stepKey" />
            <span>{{ d.title }}</span>
          </li>
        </ul>
        <button type="button" class="btn-primary text-sm" @click="applyRefresh">{{ t('guides.applyRefresh') }}</button>
      </div>

      <RunbookStepEditor
        v-for="step in data.steps"
        :key="step.id"
        :step="step"
        :saving="stepSaving === step.id"
        @save="(p) => saveStep(step.id, p)"
      />
    </section>

    <section v-if="data.executions?.length" class="card p-5">
      <h2 class="text-sm font-medium uppercase tracking-wide text-subtle">{{ t('guides.executionHistory') }}</h2>
      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="ex in data.executions" :key="ex.id">
          <NuxtLink :to="`/guides/${id}/execute/${ex.id}`" class="underline">
            {{ t(`guides.executionStatus.${ex.status}`) }} — {{ new Date(ex.startedAt).toLocaleString() }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <p v-if="message" class="text-sm text-green-800">{{ message }}</p>
  </div>
</template>
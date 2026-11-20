<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const projectId = computed(() => String(route.params.id))

useAppPageTitle('pageTitles.projectCopy')

const { data: session } = useSessionFetch()

const isTeamWorkspace = computed(() => session.value?.user?.workspaceType === 'team')

onMounted(() => {
  if (!isTeamWorkspace.value) {
    void navigateTo('/projects/import-personal')
  }
})

watch(isTeamWorkspace, (team) => {
  if (!team) void navigateTo('/projects/import-personal')
})

const targetWorkspaceId = computed(() => session.value?.user?.workspaceId ?? '')
const targetTeamName = computed(() => session.value?.user?.workspaceName?.trim() || t('workspace.unnamedTeam'))

const preview = ref<{
  rows: Array<{
    id: string
    category: string
    label: string
    sensitivity: string
    blockReason?: string
    included: boolean
  }>
  summary: Record<string, number>
} | null>(null)

const selected = ref<Record<string, boolean>>({})
const confirmFlagged = ref(false)
const loading = ref(false)
const error = ref('')
const message = ref('')

const categories = computed(() => {
  if (!preview.value) return []
  const map = new Map<string, typeof preview.value.rows>()
  for (const row of preview.value.rows) {
    const list = map.get(row.category) ?? []
    list.push(row)
    map.set(row.category, list)
  }
  return [...map.entries()]
})

const flaggedSelected = computed(() =>
  preview.value?.rows.some((r) => selected.value[r.id] && r.sensitivity === 'flagged'),
)

async function loadPreview() {
  error.value = ''
  if (!targetWorkspaceId.value) {
    error.value = t('projectCopy.importTeamOnly')
    return
  }
  loading.value = true
  try {
    const res = await $fetch(`/api/projects/${projectId.value}/copy/preview`, {
      method: 'POST',
      body: { targetWorkspaceId: targetWorkspaceId.value },
    })
    preview.value = res
    const next: Record<string, boolean> = {}
    for (const row of res.rows) {
      next[row.id] = row.sensitivity !== 'blocked' && row.included
    }
    selected.value = next
    confirmFlagged.value = false
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    loading.value = false
  }
}

function toggleCategory(category: string, on: boolean) {
  for (const row of preview.value?.rows ?? []) {
    if (row.category === category && row.sensitivity !== 'blocked') {
      selected.value[row.id] = on
    }
  }
}

async function commit() {
  error.value = ''
  if (!targetWorkspaceId.value || !preview.value) return
  if (flaggedSelected.value && !confirmFlagged.value) {
    error.value = t('projectCopy.confirmFlaggedRequired')
    return
  }
  loading.value = true
  try {
    const ids = Object.entries(selected.value)
      .filter(([, on]) => on)
      .map(([id]) => id)
    const res = await $fetch<{ projectId: string }>(`/api/projects/${projectId.value}/copy/commit`, {
      method: 'POST',
      body: {
        targetWorkspaceId: targetWorkspaceId.value,
        selectedRowIds: ids,
        confirmFlagged: confirmFlagged.value,
      },
    })
    message.value = t('projectCopy.success')
    await navigateTo(`/projects/${res.projectId}`)
  } catch (e: unknown) {
    error.value = formatApiError(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-stack max-w-3xl">
    <header>
      <NuxtLink to="/projects/import-personal" class="text-sm text-muted underline">
        {{ t('projectCopy.backToImport') }}
      </NuxtLink>
      <h1 class="page-title mt-2">{{ t('projectCopy.title') }}</h1>
      <p class="lede">{{ t('projectCopy.importCopyLede') }}</p>
    </header>

    <section v-if="isTeamWorkspace" class="card space-y-4 p-6">
      <p class="text-sm text-ink">
        {{ t('projectCopy.importTargetTeam', { name: targetTeamName }) }}
      </p>
      <button type="button" class="btn-secondary" :disabled="loading" @click="loadPreview">
        {{ t('projectCopy.loadPreview') }}
      </button>
    </section>

    <section v-if="preview" class="space-y-6">
      <p class="text-sm text-muted">
        {{
          t('projectCopy.summary', {
            total: preview.summary.total,
            flagged: preview.summary.flagged,
            blocked: preview.summary.blocked,
          })
        }}
      </p>

      <article v-for="[cat, rows] in categories" :key="cat" class="card p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 class="font-medium capitalize text-ink">{{ t(`projectCopy.categories.${cat}`, cat) }}</h2>
          <div class="flex gap-2 text-xs">
            <button type="button" class="underline" @click="toggleCategory(cat, true)">
              {{ t('projectCopy.selectAll') }}
            </button>
            <button type="button" class="underline" @click="toggleCategory(cat, false)">
              {{ t('projectCopy.selectNone') }}
            </button>
          </div>
        </div>
        <ul class="space-y-2 text-sm">
          <li v-for="row in rows" :key="row.id" class="flex flex-wrap items-start gap-2">
            <input
              v-model="selected[row.id]"
              type="checkbox"
              class="checkbox mt-1"
              :disabled="row.sensitivity === 'blocked'"
            />
            <div>
              <span class="font-medium">{{ row.label }}</span>
              <span
                v-if="row.sensitivity === 'flagged'"
                class="ml-2 text-xs uppercase text-amber-800 dark:text-amber-200"
              >{{ t('projectCopy.flagged') }}</span>
              <span v-if="row.sensitivity === 'blocked'" class="ml-2 text-xs text-red-700">
                {{ t('projectCopy.blocked') }} — {{ row.blockReason }}
              </span>
            </div>
          </li>
        </ul>
      </article>

      <label v-if="flaggedSelected" class="flex items-start gap-2 text-sm">
        <input v-model="confirmFlagged" type="checkbox" class="checkbox mt-1" />
        <span>{{ t('projectCopy.confirmFlaggedLabel') }}</span>
      </label>

      <button type="button" class="btn-primary" :disabled="loading" @click="commit">
        {{ t('projectCopy.commit') }}
      </button>
    </section>

    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-if="message" class="text-sm text-green-800">{{ message }}</p>
  </div>
</template>
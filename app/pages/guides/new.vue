<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

useAppPageTitle('pageTitles.guidesNew')

const templateSlug = ref(typeof route.query.template === 'string' ? route.query.template : '')
const projectId = ref(typeof route.query.projectId === 'string' ? route.query.projectId : '')
const environmentId = ref('')
const title = ref('')
const error = ref('')
const loading = ref(false)
const liveBinding = ref(false)

const { data: templates } = await useFetch('/api/runbook-templates')
const { data: projects } = await useFetch('/api/projects')

type ListedTemplate = { slug: string; title: string; scope?: string; requiredInputs?: string[]; stepsOutline?: unknown[]; stepCount?: number }

const selectedTemplate = computed(() =>
  (templates.value?.templates as ListedTemplate[] | undefined)?.find((tpl) => tpl.slug === templateSlug.value),
)

const workspaceTemplateOptions = computed(() =>
  ((templates.value?.templates ?? []) as ListedTemplate[]).filter((t) => t.scope === 'workspace'),
)
const systemTemplateOptions = computed(() =>
  ((templates.value?.templates ?? []) as ListedTemplate[]).filter((t) => t.scope !== 'workspace'),
)

const needsEnvironment = computed(() => selectedTemplate.value?.requiredInputs?.includes('environmentId'))

const { data: envs, refresh: refreshEnvs } = await useFetch(
  () => (projectId.value ? `/api/environments?projectId=${projectId.value}` : null),
  { watch: [projectId] },
)

watch(projectId, () => {
  environmentId.value = ''
  if (projectId.value) refreshEnvs()
})

watch(
  selectedTemplate,
  (tpl) => {
    if (tpl && !title.value) title.value = tpl.title
  },
  { immediate: true },
)

async function createRunbook() {
  error.value = ''
  if (!templateSlug.value || !projectId.value) {
    error.value = t('guides.createMissingFields')
    return
  }
  if (needsEnvironment.value && !environmentId.value) {
    error.value = t('guides.createMissingEnvironment')
    return
  }
  loading.value = true
  try {
    const res = await $fetch<{ runbook: { id: string } }>('/api/runbooks/from-template', {
      method: 'POST',
      body: {
        templateSlug: templateSlug.value,
        projectId: projectId.value,
        environmentId: environmentId.value || undefined,
        title: title.value || undefined,
      },
    })
    await router.push(`/guides/${res.runbook.id}`)
  } catch (e: unknown) {
    error.value = (e as { statusMessage?: string })?.statusMessage ?? t('common.errorGeneric')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6">
    <p class="text-sm">
      <NuxtLink to="/guides/templates" class="text-stone-600 underline">{{ t('guides.templates.browseAll') }}</NuxtLink>
    </p>
    <h1 class="page-title">{{ t('guides.newTitle') }}</h1>
    <p class="lede">{{ t('guides.newSubtitle') }}</p>

    <AppCallout v-if="selectedTemplate" :title="t('guides.templates.previewTitle')" variant="info">
      {{ t(`runbooks.templates.${selectedTemplate.slug}.description`, selectedTemplate.description ?? '') }}
      <p class="mt-2 text-sm">
        {{ t('guides.templates.stepCount', { count: selectedTemplate.stepsOutline?.length ?? selectedTemplate.stepCount ?? 0 }) }}
        ·
        <NuxtLink :to="`/guides/templates/${selectedTemplate.slug}`" class="underline">
          {{ t('guides.templates.viewDetails') }}
        </NuxtLink>
      </p>
    </AppCallout>

    <form class="card space-y-4 p-5" @submit.prevent="createRunbook">
      <label class="block text-sm">
        <span class="font-medium text-stone-700">{{ t('guides.fieldTemplate') }}</span>
        <select v-model="templateSlug" class="field mt-1.5 w-full" required>
          <option value="" disabled>{{ t('guides.pickTemplate') }}</option>
          <optgroup v-if="workspaceTemplateOptions.length" :label="t('guides.templates.workspaceSection')">
            <option v-for="tpl in workspaceTemplateOptions" :key="tpl.slug" :value="tpl.slug">
              {{ tpl.title }}
            </option>
          </optgroup>
          <optgroup :label="t('guides.templates.browseAll')">
            <option v-for="tpl in systemTemplateOptions" :key="tpl.slug" :value="tpl.slug">
              {{ t(`runbooks.templates.${tpl.slug}.title`, tpl.title) }}
            </option>
          </optgroup>
        </select>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-stone-700">{{ t('guides.fieldProject') }}</span>
        <select v-model="projectId" class="field mt-1.5 w-full" required>
          <option value="" disabled>{{ t('guides.pickProject') }}</option>
          <option v-for="p in projects?.projects ?? []" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </label>

      <label v-if="needsEnvironment" class="block text-sm">
        <span class="font-medium text-stone-700">{{ t('guides.fieldEnvironment') }}</span>
        <select v-model="environmentId" class="field mt-1.5 w-full" required>
          <option value="" disabled>{{ t('guides.pickEnvironment') }}</option>
          <option v-for="e in envs?.environments ?? []" :key="e.id" :value="e.id">{{ e.name }} ({{ e.kind }})</option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="font-medium text-stone-700">{{ t('guides.fieldTitle') }}</span>
        <input v-model="title" type="text" class="field mt-1.5 w-full" />
      </label>

      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>

      <button type="submit" class="btn-primary w-full" :disabled="loading">
        {{ loading ? t('common.saving') : t('guides.createRunbook') }}
      </button>
    </form>

    <p class="text-xs text-stone-500">{{ t('guides.liveBindingHint') }}</p>
  </div>
</template>
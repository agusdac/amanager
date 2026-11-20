<script setup lang="ts">
const { t, te } = useI18n()
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const projectQuery = computed(() =>
  typeof route.query.projectId === 'string' ? `&projectId=${route.query.projectId}` : '',
)

const { data, error, pending } = await useFetch(() => `/api/runbook-templates/${slug.value}`, { watch: [slug] })

const tpl = computed(() => data.value?.template)

const title = computed(() =>
  tpl.value && te(`runbooks.templates.${tpl.value.slug}.title`)
    ? t(`runbooks.templates.${tpl.value.slug}.title`)
  : tpl.value?.title ?? '',
)

const description = computed(() =>
  tpl.value && te(`runbooks.templates.${tpl.value.slug}.description`)
    ? t(`runbooks.templates.${tpl.value.slug}.description`)
    : (tpl.value?.description ?? ''),
)

const howTo = computed(() => {
  const key = `runbooks.templates.${slug.value}.howTo`
  if (!te(key)) return []
  const raw = t(key)
  return raw.split('\n').map((line) => line.trim()).filter(Boolean)
})

useAppPageTitle(computed(() => (title.value ? title.value : t('pageTitles.guidesTemplates'))))

const router = useRouter()
const deleteOpen = ref(false)
const deleting = ref(false)
const deleteError = ref('')

async function deleteTemplate() {
  deleteError.value = ''
  deleting.value = true
  try {
    await $fetch(`/api/runbook-templates/${slug.value}`, { method: 'DELETE' })
    await router.push('/guides')
  } catch (e: unknown) {
    deleteError.value = (e as { statusMessage?: string })?.statusMessage ?? t('common.errorGeneric')
  } finally {
    deleting.value = false
    deleteOpen.value = false
  }
}
</script>

<template>
  <div v-if="pending" class="text-sm text-subtle">{{ t('common.loading') }}</div>
  <div v-else-if="!tpl" class="text-sm text-muted">{{ t('guides.templates.notFound') }}</div>
  <div v-else class="mx-auto max-w-2xl space-y-8">
    <p class="text-sm">
      <NuxtLink to="/guides/templates" class="text-muted underline">{{ t('guides.templates.backToCatalog') }}</NuxtLink>
    </p>

    <header>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="description" class="lede">{{ description }}</p>
      <p class="mt-2 text-sm text-subtle">
        {{ t('guides.templates.stepCount', { count: tpl.stepCount }) }}
        ·
        {{
          tpl.requiredInputs.includes('environmentId')
            ? t('guides.templates.requiresProjectEnv')
            : t('guides.templates.requiresProject')
        }}
      </p>
    </header>

    <section v-if="howTo.length" class="card space-y-3 p-5">
      <h2 class="text-sm font-medium uppercase tracking-wide text-subtle">
        {{ t('guides.templates.howToTitle') }}
      </h2>
      <ol class="list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
        <li v-for="(line, i) in howTo" :key="i">{{ line }}</li>
      </ol>
    </section>

    <section class="card space-y-3 p-5">
      <h2 class="text-sm font-medium uppercase tracking-wide text-subtle">{{ t('guides.templates.stepsTitle') }}</h2>
      <p class="text-sm text-muted">{{ t('guides.templates.stepsHint') }}</p>
      <ol class="space-y-3">
        <li
          v-for="step in tpl.stepsOutline"
          :key="step.key"
          class="border-l-2 border-rule pl-3 text-sm"
        >
          <span class="font-medium text-ink">{{ step.position }}. {{ step.title }}</span>
          <span class="ml-2 text-xs text-subtle">
            {{ t(`guides.stepKinds.${step.kind}`) }} · {{ t(`guides.stepRisks.${step.risk}`) }}
          </span>
          <p v-if="step.inventoryTargetLabel" class="mt-1 text-xs text-sky-900">
            {{ t('guides.templates.inventoryScopeSpecific') }}: {{ step.inventoryTargetLabel }}
          </p>
          <p
            v-if="step.generator && step.generator !== 'static_markdown'"
            class="mt-1 text-xs text-sky-900"
          >
            {{ t(`guides.templates.inventoryGenerators.${step.generator}`) }}
            <span v-if="step.assetType" class="text-subtle">· {{ step.assetType }}</span>
          </p>
          <AppMarkdownPreview v-if="step.bodyMarkdown" class="mt-2 text-ink-secondary" :markdown="step.bodyMarkdown" />
        </li>
      </ol>
    </section>

    <section class="card space-y-2 border-rule bg-stone-50/80 dark:bg-stone-900/80 p-5 text-sm text-ink-secondary">
      <h2 class="font-medium text-ink">{{ t('guides.templates.afterCreateTitle') }}</h2>
      <p>{{ t('guides.templates.afterCreateBody') }}</p>
    </section>

    <div class="flex flex-wrap gap-2">
      <NuxtLink
        v-if="tpl.scope === 'workspace'"
        :to="`/guides/templates/workspace?slug=${tpl.slug}`"
        class="btn-secondary inline-flex"
      >
        {{ t('guides.templates.editWorkspace') }}
      </NuxtLink>
      <NuxtLink
        :to="`/guides/new?template=${tpl.slug}${projectQuery}`"
        class="btn-primary inline-flex"
      >
        {{ t('guides.templates.useTemplate') }}
      </NuxtLink>
      <button
        v-if="tpl.scope === 'workspace'"
        type="button"
        class="inline-flex rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
        @click="deleteOpen = true"
      >
        {{ t('guides.templates.deleteWorkspace') }}
      </button>
    </div>

    <p v-if="deleteError" class="text-sm text-red-700">{{ deleteError }}</p>

    <AppConfirmDialog
      v-model:open="deleteOpen"
      variant="danger"
      :title="t('guides.templates.deleteWorkspaceTitle')"
      :description="t('guides.templates.deleteWorkspaceDescription')"
      :confirm-label="deleting ? t('common.loading') : t('guides.templates.deleteWorkspaceConfirm')"
      @confirm="deleteTemplate"
    />
  </div>
</template>
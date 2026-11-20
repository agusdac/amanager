<script setup lang="ts">
const props = defineProps<{
  template: {
    slug: string
    title: string
    stepCount: number
    requiredInputs: string[]
    description?: string | null
    scope?: 'system' | 'workspace'
  }
  createQuery?: string
}>()

const isWorkspace = computed(() => props.template.scope === 'workspace')

const { t, te } = useI18n()

const title = computed(() =>
  te(`runbooks.templates.${props.template.slug}.title`)
    ? t(`runbooks.templates.${props.template.slug}.title`)
    : props.template.title,
)

const description = computed(() =>
  te(`runbooks.templates.${props.template.slug}.description`)
    ? t(`runbooks.templates.${props.template.slug}.description`)
    : (props.template.description ?? ''),
)

const inputsLabel = computed(() => {
  const needsEnv = props.template.requiredInputs.includes('environmentId')
  return needsEnv ? t('guides.templates.requiresProjectEnv') : t('guides.templates.requiresProject')
})
</script>

<template>
  <article class="card flex flex-col gap-3 p-5">
    <div>
      <h2 class="text-lg font-medium text-ink">
        <NuxtLink :to="`/guides/templates/${template.slug}`" class="underline">{{ title }}</NuxtLink>
      </h2>
      <p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p>
    </div>
    <ul class="flex flex-wrap gap-2 text-xs text-subtle">
      <li class="rounded-full bg-surface-soft px-2 py-0.5">{{ t('guides.templates.stepCount', { count: template.stepCount }) }}</li>
      <li class="rounded-full bg-surface-soft px-2 py-0.5">{{ inputsLabel }}</li>
      <li
        v-if="isWorkspace"
        class="rounded-full bg-sky-50 px-2 py-0.5 text-sky-900 dark:bg-sky-950/50 dark:text-sky-300"
      >
        {{ t('guides.templates.workspaceBadge') }}
      </li>
    </ul>
    <div class="mt-auto flex flex-wrap gap-2 pt-1">
      <NuxtLink v-if="isWorkspace" :to="`/guides/templates/workspace?slug=${template.slug}`" class="btn-secondary text-sm">
        {{ t('guides.templates.editWorkspace') }}
      </NuxtLink>
      <NuxtLink v-else :to="`/guides/templates/${template.slug}`" class="btn-secondary text-sm">
        {{ t('guides.templates.viewDetails') }}
      </NuxtLink>
      <NuxtLink :to="`/guides/new?template=${template.slug}${createQuery ?? ''}`" class="btn-primary text-sm">
        {{ t('guides.templates.useTemplate') }}
      </NuxtLink>
    </div>
  </article>
</template>
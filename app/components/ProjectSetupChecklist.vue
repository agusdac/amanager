<script setup lang="ts">
const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const STORAGE_KEY = computed(() => `hilko-setup-checklist-${props.projectId}`)

const done = ref<Record<string, boolean>>({})

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY.value)
    if (raw) done.value = JSON.parse(raw) as Record<string, boolean>
  } catch {
    done.value = {}
  }
})

function toggle(id: string) {
  done.value[id] = !done.value[id]
  localStorage.setItem(STORAGE_KEY.value, JSON.stringify(done.value))
}

const steps = computed(() => [
  {
    id: 'assets',
    label: t('setupChecklist.reviewAssets'),
    hint: t('setupChecklist.reviewAssetsHint'),
    to: '/assets?verification=needs_confirmation',
  },
  {
    id: 'identities',
    label: t('setupChecklist.identities'),
    hint: t('setupChecklist.identitiesHint'),
    to: '/accounts',
  },
  {
    id: 'access',
    label: t('setupChecklist.linkAccess'),
    hint: t('setupChecklist.linkAccessHint'),
    to: '/accounts',
  },
  {
    id: 'dependencies',
    label: t('setupChecklist.dependencies'),
    hint: t('setupChecklist.dependenciesHint'),
    to: `/projects/${props.projectId}?tab=dependencies`,
  },
  {
    id: 'verify',
    label: t('setupChecklist.verify'),
    hint: t('setupChecklist.verifyHint'),
    to: '/guide/verification',
  },
])

const progress = computed(() => {
  const total = steps.value.length
  const n = steps.value.filter((s) => done.value[s.id]).length
  return { n, total }
})
</script>

<template>
  <section class="card border-stone-200 bg-gradient-to-b from-white to-stone-50/80 p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="section-title">{{ t('setupChecklist.title') }}</h2>
        <p class="lede mt-1">{{ t('setupChecklist.subtitle') }}</p>
      </div>
      <p class="text-sm text-stone-600">
        {{ t('setupChecklist.progress', { done: progress.n, total: progress.total }) }}
      </p>
    </div>
    <ol class="mt-5 space-y-3">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        class="flex gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3"
      >
        <button
          type="button"
          class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors"
          :class="
            done[step.id]
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-stone-300 text-stone-600 hover:border-stone-500'
          "
          :aria-pressed="done[step.id]"
          @click="toggle(step.id)"
        >
          <IconCheck v-if="done[step.id]" class="h-4 w-4" />
          <span v-else>{{ index + 1 }}</span>
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-stone-900">{{ step.label }}</span>
            <NuxtLink :to="step.to" class="text-sm font-medium text-stone-700 underline decoration-stone-300">
              {{ t('setupChecklist.open') }}
            </NuxtLink>
          </div>
          <p class="mt-0.5 text-sm text-stone-600">{{ step.hint }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>
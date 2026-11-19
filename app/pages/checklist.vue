<script setup lang="ts">
const { t } = useI18n()
const STORAGE_KEY = 'accessmap-dogfood-checklist'

useAppPageTitle('pageTitles.checklist')

const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'] as const

const fallbackLinks: Record<(typeof questionIds)[number], { to: string; labelKey: string }[]> = {
  q1: [{ to: '/accounts?tab=identities', labelKey: 'checklist.links.identities' }],
  q2: [{ to: '/accounts?tab=emails', labelKey: 'checklist.links.emails' }],
  q3: [{ to: '/assets', labelKey: 'nav.assets' }],
  q4: [{ to: '/assets', labelKey: 'nav.assets' }],
  q5: [{ to: '/assets', labelKey: 'nav.assets' }],
  q6: [{ to: '/assets', labelKey: 'nav.assets' }],
  q7: [{ to: '/assets', labelKey: 'nav.assets' }],
  q8: [{ to: '/assets', labelKey: 'nav.assets' }],
  q9: [{ to: '/accounts?tab=identities', labelKey: 'checklist.links.identities' }],
  q10: [{ to: '/assets?tab=impact', labelKey: 'tabs.assets.impact' }],
}

const { data: linkPack } = await useFetch('/api/dogfood/quick-links')

function linksFor(id: (typeof questionIds)[number]) {
  const fromApi = linkPack.value?.questions?.[id]
  if (fromApi?.length) return fromApi
  return fallbackLinks[id] ?? []
}

const checked = ref<Record<string, boolean>>({})

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) checked.value = JSON.parse(raw) as Record<string, boolean>
  } catch {
    checked.value = {}
  }
})

watch(
  checked,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true },
)

const doneCount = computed(() => questionIds.filter((id) => checked.value[id]).length)

function toggle(id: string) {
  checked.value[id] = !checked.value[id]
}

function reset() {
  checked.value = {}
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <header class="space-y-2">
      <h1 class="page-title">{{ t('checklist.title') }}</h1>
      <p class="lede">{{ t('checklist.subtitle') }}</p>
      <p class="text-sm font-medium tabular-nums text-stone-700">
        {{ t('checklist.progress', { done: doneCount, total: questionIds.length }) }}
      </p>
      <button type="button" class="text-sm text-stone-500 underline hover:text-stone-800" @click="reset">
        {{ t('checklist.reset') }}
      </button>
    </header>

    <ol class="space-y-4">
      <li
        v-for="(id, index) in questionIds"
        :key="id"
        class="card p-5"
      >
        <label class="flex cursor-pointer gap-3">
          <input
            type="checkbox"
            class="mt-1 rounded border-stone-300"
            :checked="!!checked[id]"
            @change="toggle(id)"
          />
          <span class="flex-1 space-y-2">
            <span class="block font-medium text-stone-900">
              {{ index + 1 }}. {{ t(`checklist.${id}`) }}
            </span>
            <span class="block text-sm text-stone-600">
              <span class="font-medium text-stone-500">{{ t('checklist.whereToLook') }}:</span>
              {{ t(`checklist.${id}hint`) }}
            </span>
            <span v-if="linksFor(id).length" class="flex flex-wrap gap-2 pt-1">
              <NuxtLink
                v-for="(link, li) in linksFor(id)"
                :key="`${link.to}-${li}`"
                :to="link.to"
                class="rounded-full border border-stone-200 bg-stone-50 px-3 py-0.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
              >
                {{ t(link.labelKey) }}
              </NuxtLink>
            </span>
          </span>
        </label>
      </li>
    </ol>

    <div class="flex flex-wrap gap-3 text-sm">
      <NuxtLink to="/projects" class="btn-secondary">{{ t('nav.projects') }}</NuxtLink>
      <NuxtLink to="/accounts" class="btn-secondary">{{ t('nav.accounts') }}</NuxtLink>
      <NuxtLink to="/assets" class="btn-secondary">{{ t('nav.assets') }}</NuxtLink>
    </div>
  </div>
</template>
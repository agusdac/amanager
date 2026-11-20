<script setup lang="ts">
const props = defineProps<{
  step: {
    id: string
    title: string
    bodyMarkdown: string
    risk: string
    kind: string
    source: string
  }
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [payload: { title: string; bodyMarkdown: string }]
}>()

const { t } = useI18n()
const title = ref(props.step.title)
const body = ref(props.step.bodyMarkdown)
const showPreview = ref(false)

watch(
  () => props.step,
  (s) => {
    title.value = s.title
    body.value = s.bodyMarkdown
  },
  { deep: true },
)
</script>

<template>
  <article class="card space-y-3 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <input v-model="title" type="text" class="field flex-1 font-medium" />
      <span class="text-xs uppercase text-subtle">{{ step.kind }} · {{ step.risk }}</span>
    </div>
    <div class="flex gap-2 text-sm">
      <button
        type="button"
        class="rounded px-2 py-0.5"
        :class="!showPreview ? 'bg-stone-900 text-white' : 'bg-surface-soft text-ink-secondary'"
        @click="showPreview = false"
      >
        {{ t('guides.editMarkdown') }}
      </button>
      <button
        type="button"
        class="rounded px-2 py-0.5"
        :class="showPreview ? 'bg-stone-900 text-white' : 'bg-surface-soft text-ink-secondary'"
        @click="showPreview = true"
      >
        {{ t('guides.previewMarkdown') }}
      </button>
    </div>
    <textarea v-if="!showPreview" v-model="body" rows="8" class="field w-full font-mono text-sm" />
    <div v-else class="card border-rule bg-stone-50/50 p-3">
      <AppMarkdownPreview :markdown="body" />
    </div>
    <button
      type="button"
      class="btn-secondary text-sm"
      :disabled="saving"
      @click="emit('save', { title: title, bodyMarkdown: body })"
    >
      {{ saving ? t('common.saving') : t('common.save') }}
    </button>
  </article>
</template>
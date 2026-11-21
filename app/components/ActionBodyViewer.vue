<script setup lang="ts">
const props = defineProps<{
  markdown: string
}>()

const { t } = useI18n()
const view = ref<'preview' | 'raw'>('preview')
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-1 rounded-lg border border-rule bg-stone-50/80 p-0.5 dark:bg-stone-900/40" role="tablist">
      <button
        type="button"
        role="tab"
        class="rounded-md px-3 py-1.5 text-sm font-medium transition"
        :class="view === 'preview' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'"
        :aria-selected="view === 'preview'"
        @click="view = 'preview'"
      >
        {{ t('actions.viewPreview') }}
      </button>
      <button
        type="button"
        role="tab"
        class="rounded-md px-3 py-1.5 text-sm font-medium transition"
        :class="view === 'raw' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'"
        :aria-selected="view === 'raw'"
        @click="view = 'raw'"
      >
        {{ t('actions.viewRaw') }}
      </button>
    </div>

    <ActionMarkdownWithCopy v-if="view === 'preview'" :markdown="props.markdown" />

    <pre
      v-else
      class="max-h-[32rem] overflow-auto rounded-lg border border-rule bg-stone-50/90 p-4 font-mono text-sm leading-relaxed text-ink dark:bg-stone-900/80"
    ><code>{{ props.markdown }}</code></pre>
  </div>
</template>
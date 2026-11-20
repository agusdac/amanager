<script setup lang="ts">
import { renderMarkdownPreview } from '../../shared/markdown/preview'

const props = defineProps<{
  markdown: string
  emptyLabel?: string
}>()

const html = computed(() => renderMarkdownPreview(props.markdown))
</script>

<template>
  <div
    v-if="markdown.trim()"
    class="markdown-preview space-y-2 text-stone-700"
    v-html="html"
  />
  <p v-else class="text-sm text-stone-400">{{ emptyLabel ?? '—' }}</p>
</template>
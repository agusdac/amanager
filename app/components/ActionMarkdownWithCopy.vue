<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import { renderMarkdownPreview } from '#shared/markdown/preview'

const props = defineProps<{
  markdown: string
}>()

const { t } = useI18n()

type Block =
  | { kind: 'prose'; text: string }
  | { kind: 'code'; text: string }

const blocks = computed(() => {
  const parts = props.markdown.split(/```/)
  const out: Block[] = []
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i] ?? ''
    if (i % 2 === 0) {
      if (chunk.trim()) out.push({ kind: 'prose', text: chunk })
    } else {
      const lines = chunk.split('\n')
      const first = lines[0]?.trim() ?? ''
      const code = (first && !first.includes(' ') ? lines.slice(1) : lines).join('\n').trimEnd()
      if (code) out.push({ kind: 'code', text: code })
    }
  }
  return out
})

const copied = ref<string | null>(null)

async function copyCode(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    setTimeout(() => {
      if (copied.value === key) copied.value = null
    }, 2000)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="space-y-4">
    <template v-for="(block, index) in blocks" :key="index">
      <div
        v-if="block.kind === 'prose'"
        class="markdown-preview space-y-2 text-ink-secondary"
        v-html="renderMarkdownPreview(block.text)"
      />
      <div v-else class="relative rounded-lg border border-rule bg-stone-50/90 pb-2 dark:bg-stone-900/80">
        <pre class="overflow-x-auto px-3 pb-10 pt-3 pr-12 text-sm text-ink"><code>{{ block.text }}</code></pre>
        <button
          type="button"
          class="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-rule bg-surface text-muted transition hover:bg-stone-200/80 hover:text-ink dark:hover:bg-stone-800"
          :aria-label="copied === `code-${index}` ? t('actions.copied') : t('actions.copy')"
          :title="copied === `code-${index}` ? t('actions.copied') : t('actions.copy')"
          @click="copyCode(block.text, `code-${index}`)"
        >
          <Check v-if="copied === `code-${index}`" class="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <Copy v-else class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </template>
  </div>
</template>
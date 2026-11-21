<script setup lang="ts">
import { Code, Heading2, Link, ListChecks, List } from 'lucide-vue-next'

const body = defineModel<string>({ required: true })

const props = defineProps<{
  rows?: number
  mono?: boolean
}>()

const { t } = useI18n()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function insertBlock(before: string, after = '', placeholder = '') {
  const el = textareaRef.value
  const value = body.value
  if (!el) {
    body.value = `${value}${before}${placeholder}${after}`
    return
  }
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = value.slice(start, end) || placeholder
  const next = value.slice(0, start) + before + selected + after + value.slice(end)
  body.value = next
  nextTick(() => {
    el.focus()
    const cursor = start + before.length + selected.length
    el.setSelectionRange(cursor, cursor)
  })
}

function insertHeading() {
  insertBlock('## ', '\n', t('actions.editor.headingPlaceholder'))
}

function insertLink() {
  insertBlock('[', '](https://)', t('actions.editor.linkLabel'))
}

function insertCode() {
  insertBlock('```bash\n', '\n```', t('actions.editor.codePlaceholder'))
}

function insertChecklist() {
  insertBlock('- [ ] ', '\n', t('actions.editor.checkItem'))
}

function insertBullet() {
  const el = textareaRef.value
  if (el) {
    const start = el.selectionStart
    const lineStart = body.value.lastIndexOf('\n', start - 1) + 1
    const prefix = body.value.slice(lineStart, start)
    if (prefix.trim() === '') {
      insertBlock('- ', '', t('actions.editor.bulletItem'))
      return
    }
  }
  insertBlock('\n- ', '', t('actions.editor.bulletItem'))
}
</script>

<template>
  <div class="action-editor space-y-2">
    <div
      class="flex flex-wrap gap-1 rounded-lg border border-rule bg-stone-50/90 p-1.5 dark:bg-stone-900/50"
      role="toolbar"
      :aria-label="t('actions.editor.toolbar')"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition hover:bg-stone-200/80 hover:text-ink dark:hover:bg-stone-800"
        :title="t('actions.editor.heading')"
        @click="insertHeading"
      >
        <Heading2 class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t('actions.editor.heading') }}</span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition hover:bg-stone-200/80 hover:text-ink dark:hover:bg-stone-800"
        :title="t('actions.editor.link')"
        @click="insertLink"
      >
        <Link class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t('actions.editor.link') }}</span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition hover:bg-stone-200/80 hover:text-ink dark:hover:bg-stone-800"
        :title="t('actions.editor.code')"
        @click="insertCode"
      >
        <Code class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t('actions.editor.code') }}</span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition hover:bg-stone-200/80 hover:text-ink dark:hover:bg-stone-800"
        :title="t('actions.editor.checklist')"
        @click="insertChecklist"
      >
        <ListChecks class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t('actions.editor.checklist') }}</span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition hover:bg-stone-200/80 hover:text-ink dark:hover:bg-stone-800"
        :title="t('actions.editor.bullet')"
        @click="insertBullet"
      >
        <List class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t('actions.editor.bullet') }}</span>
      </button>
    </div>
    <textarea
      ref="textareaRef"
      v-model="body"
      :rows="rows ?? 12"
      class="field w-full resize-y"
      :class="mono !== false ? 'font-mono text-sm leading-relaxed' : ''"
      :placeholder="t('actions.fieldBodyPlaceholder')"
    />
  </div>
</template>
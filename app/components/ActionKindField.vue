<script setup lang="ts">
import { CheckSquare, Code, FileText } from 'lucide-vue-next'
import { ACTION_KINDS, type ActionKind } from '#shared/schemas/actions'
import { defaultBodyForKind, shouldApplyKindTemplate } from '#shared/actions/kindDefaults'

const kind = defineModel<ActionKind>({ required: true })
const bodyMarkdown = defineModel<string>('bodyMarkdown', { required: true })

const { t } = useI18n()

const icons = { command: Code, checklist: CheckSquare, reference: FileText } as const

function pick(next: ActionKind) {
  const prev = kind.value
  if (shouldApplyKindTemplate(bodyMarkdown.value, prev)) {
    bodyMarkdown.value = defaultBodyForKind(next)
  }
  kind.value = next
}
</script>

<template>
  <fieldset class="space-y-2">
    <legend class="label">{{ t('actions.fieldKind') }}</legend>
    <p class="text-xs text-muted">{{ t('actions.kindHint') }}</p>
    <div class="grid gap-2 sm:grid-cols-3">
      <button
        v-for="k in ACTION_KINDS"
        :key="k"
        type="button"
        class="flex flex-col items-start gap-1 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-left transition hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600"
        :class="
          kind === k
            ? 'border-stone-800 ring-1 ring-stone-800/20 dark:border-stone-300 dark:ring-stone-300/20'
            : ''
        "
        @click="pick(k)"
      >
        <component :is="icons[k]" class="h-5 w-5 shrink-0" aria-hidden="true" />
        <span class="font-medium text-ink">{{ t(`actions.kinds.${k}`) }}</span>
        <span class="text-xs text-subtle">{{ t(`actions.kindDescriptions.${k}`) }}</span>
      </button>
    </div>
  </fieldset>
</template>
<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import type { SourceId } from '#shared/import/sources'

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()

const guideIds: SourceId[] = ['hilko', 'sheet', 'notion', 'confluence', 'other']
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[100] bg-stone-900/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-[101] max-h-[min(90vh,36rem)] w-[min(calc(100vw-2rem),42rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-rule bg-surface p-6 shadow-2xl focus:outline-none"
      >
        <DialogTitle class="text-lg font-semibold text-ink">
          {{ t('import.exportGuidesTitle') }}
        </DialogTitle>
        <DialogDescription class="mt-2 text-sm leading-relaxed text-subtle">
          {{ t('import.exportGuidesHint') }}
        </DialogDescription>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <article
            v-for="id in guideIds"
            :key="id"
            class="card flex flex-col gap-2 p-4 text-left"
          >
            <h3 class="font-semibold text-ink">{{ t(`import.sources.${id}.title`) }}</h3>
            <p class="text-sm text-muted">{{ t(`import.sources.${id}.hint`) }}</p>
            <p class="mt-auto text-xs leading-relaxed text-subtle">{{ t(`import.sources.${id}.recipe`) }}</p>
          </article>
        </div>

        <div class="mt-6 flex justify-end">
          <DialogClose as-child>
            <button type="button" class="btn-primary text-sm">{{ t('import.exportGuidesClose') }}</button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
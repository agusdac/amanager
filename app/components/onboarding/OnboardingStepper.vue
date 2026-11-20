<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  current: number
  total: number
  labels: string[]
  canNavigateTo?: (step: number) => boolean
  navigateBlockReason?: (step: number) => string | null
}>()

const emit = defineEmits<{
  navigate: [step: number]
}>()

function stepState(index: number) {
  const n = index + 1
  if (n < props.current) return 'done' as const
  if (n === props.current) return 'current' as const
  return 'upcoming' as const
}

function stepNumber(index: number) {
  return index + 1
}

function isClickable(index: number) {
  const n = stepNumber(index)
  if (n === props.current) return false
  return props.canNavigateTo?.(n) ?? true
}

function blockReason(index: number) {
  const n = stepNumber(index)
  return props.navigateBlockReason?.(n) ?? null
}

function onStepClick(index: number) {
  const n = stepNumber(index)
  if (!isClickable(index)) return
  emit('navigate', n)
}
</script>

<template>
  <ol
    class="grid gap-2 sm:grid-cols-3 lg:grid-cols-6"
    :aria-label="t('onboarding.progressLabel')"
  >
    <li
      v-for="(label, index) in labels"
      :key="index"
    >
      <button
        type="button"
        class="relative flex min-w-0 w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left transition-colors"
        :class="{
          'border-stone-900 bg-stone-900 text-white dark:border-stone-200 dark:bg-stone-100 dark:text-ink':
            stepState(index) === 'current',
          'border-rule bg-surface text-subtle hover:border-stone-300 hover:bg-surface-muted dark:hover:border-stone-600':
            stepState(index) === 'upcoming' && isClickable(index),
          'border-rule bg-surface text-subtle cursor-not-allowed opacity-70':
            stepState(index) === 'upcoming' && !isClickable(index),
          'border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300':
            stepState(index) === 'done',
          'cursor-pointer': isClickable(index) || stepState(index) === 'done',
        }"
        :disabled="stepState(index) === 'upcoming' && !isClickable(index)"
        :title="blockReason(index) ?? undefined"
        :aria-current="stepState(index) === 'current' ? 'step' : undefined"
        @click="onStepClick(index)"
      >
        <span class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-80">
          <IconCheck v-if="stepState(index) === 'done'" class="h-3.5 w-3.5" />
          <span v-else class="tabular-nums">{{ index + 1 }}</span>
        </span>
        <span class="truncate text-sm font-medium leading-tight">{{ label }}</span>
      </button>
    </li>
  </ol>
</template>
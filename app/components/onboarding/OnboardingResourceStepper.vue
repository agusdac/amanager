<script setup lang="ts">
const props = defineProps<{
  current: number
  labels: string[]
}>()

const emit = defineEmits<{ navigate: [index: number] }>()

const { t } = useI18n()

function stepState(index: number) {
  if (index < props.current) return 'done' as const
  if (index === props.current) return 'current' as const
  return 'upcoming' as const
}

function onPick(index: number) {
  if (index === props.current) return
  emit('navigate', index)
}
</script>

<template>
  <div class="space-y-2">
    <p class="sr-only">
      {{ t('onboarding.resourceProgress', { current: current + 1, total: labels.length }) }}
    </p>
    <ol
      class="flex gap-2 overflow-x-auto pb-1"
      :aria-label="t('onboarding.resourceStepperLabel')"
    >
      <li v-for="(label, index) in labels" :key="index" class="min-w-[7rem] max-w-[11rem] shrink-0">
        <button
          type="button"
          class="relative flex min-w-0 w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left transition-colors"
          :class="{
            'border-stone-900 bg-stone-900 text-white dark:border-stone-200 dark:bg-stone-100 dark:text-ink':
              stepState(index) === 'current',
            'border-rule bg-surface text-subtle hover:border-stone-300 hover:bg-surface-muted dark:hover:border-stone-600':
              stepState(index) === 'upcoming',
            'border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300':
              stepState(index) === 'done',
            'cursor-pointer': index !== current,
          }"
          :aria-current="index === current ? 'step' : undefined"
          @click="onPick(index)"
        >
          <span class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-80">
            <IconCheck v-if="stepState(index) === 'done'" class="h-3.5 w-3.5" />
            <span v-else class="tabular-nums">{{ index + 1 }}</span>
          </span>
          <span class="truncate text-sm font-medium leading-tight">{{ label }}</span>
        </button>
      </li>
    </ol>
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  current: number
  total: number
  labels: string[]
}>()

function stepState(index: number) {
  const n = index + 1
  if (n < props.current) return 'done' as const
  if (n === props.current) return 'current' as const
  return 'upcoming' as const
}
</script>

<template>
  <ol class="grid gap-2 sm:grid-cols-5" :aria-label="t('onboarding.progressLabel')">
    <li
      v-for="(label, index) in labels"
      :key="index"
      class="relative flex min-w-0 flex-col gap-1 rounded-lg border px-3 py-2 text-left transition-colors"
      :class="{
        'border-stone-900 bg-stone-900 text-white': stepState(index) === 'current',
        'border-stone-200 bg-white text-stone-500': stepState(index) === 'upcoming',
        'border-emerald-200 bg-emerald-50 text-emerald-900': stepState(index) === 'done',
      }"
    >
      <span class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-80">
        <IconCheck v-if="stepState(index) === 'done'" class="h-3.5 w-3.5" />
        <span v-else class="tabular-nums">{{ index + 1 }}</span>
      </span>
      <span class="truncate text-sm font-medium leading-tight">{{ label }}</span>
    </li>
  </ol>
</template>
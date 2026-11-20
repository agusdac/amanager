<script setup lang="ts">
const props = defineProps<{
  status: string
}>()

const { t } = useI18n()

const label = computed(() => {
  const key = `verification.${props.status}`
  const translated = t(key)
  return translated !== key ? translated : props.status.replaceAll('_', ' ')
})

const tone = computed(() => {
  switch (props.status) {
    case 'confirmed_by_human':
    case 'verified_by_integration':
    case 'confirmed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
    case 'unverified':
      return 'border-stone-300 dark:border-stone-600 bg-surface-soft text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300'
    default:
      return 'border-rule bg-surface-soft text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium leading-tight"
    :class="tone"
  >
    {{ label }}
  </span>
</template>
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
      return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    case 'unverified':
      return 'border-stone-300 bg-stone-100 text-stone-700'
    default:
      return 'border-stone-200 bg-stone-100 text-stone-700'
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
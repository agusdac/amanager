<script setup lang="ts">
import { resolveBrandIcon } from '~/constants/brandIcons'
import { brandIconFill } from '~/utils/brandIconFill'

const props = withDefaults(
  defineProps<{
    providerSlug?: string | null
    assetType?: string | null
    size?: number
    title?: string
    framed?: boolean
  }>(),
  { size: 16, providerSlug: null, assetType: null, framed: true },
)

const { theme } = useAppTheme()

const icon = computed(() => resolveBrandIcon(props.providerSlug, props.assetType))

const label = computed(() => props.title ?? icon.value?.title ?? '')

const pathFill = computed(() => {
  const entry = icon.value
  if (!entry) return 'currentColor'
  return brandIconFill(entry.hex, theme.value === 'dark')
})

const shellPx = computed(() => Math.max(props.size + 6, 20))
</script>

<template>
  <span
    v-if="icon"
    class="inline-flex shrink-0 items-center justify-center"
    :class="
      framed
        ? 'rounded bg-surface-soft ring-1 ring-stone-200 dark:bg-stone-800 dark:ring-stone-600'
        : ''
    "
    :style="framed ? { width: `${shellPx}px`, height: `${shellPx}px` } : undefined"
    role="img"
    :aria-label="label"
  >
    <title v-if="label">{{ label }}</title>
    <svg :width="size" :height="size" viewBox="0 0 24 24" class="shrink-0" aria-hidden="true">
      <path :d="icon.path" :fill="pathFill" />
    </svg>
  </span>
</template>
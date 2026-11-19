<script setup lang="ts">
import { resolveBrandIcon } from '~/constants/brandIcons'

const props = withDefaults(
  defineProps<{
    providerSlug?: string | null
    assetType?: string | null
    size?: number
    title?: string
  }>(),
  { size: 16, providerSlug: null, assetType: null },
)

const icon = computed(() => resolveBrandIcon(props.providerSlug, props.assetType))

const label = computed(() => props.title ?? icon.value?.title ?? '')
</script>

<template>
  <svg
    v-if="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    class="shrink-0"
    role="img"
    :aria-label="label"
  >
    <title v-if="label">{{ label }}</title>
    <path :d="icon.path" :fill="`#${icon.hex}`" />
  </svg>
</template>
<script setup lang="ts">
import { AlertTriangle, Info } from 'lucide-vue-next'
import { UI_ICON_STROKE } from '~/components/icons/uiIconDefaults'

const props = withDefaults(
  defineProps<{
    title?: string
    variant?: 'warning' | 'info' | 'neutral'
  }>(),
  { variant: 'warning' },
)

const icon = computed(() => (props.variant === 'info' ? Info : AlertTriangle))
</script>

<template>
  <div
    class="callout"
    :class="{
      'callout-warning': variant === 'warning',
      'callout-info': variant === 'info',
      'callout-neutral': variant === 'neutral',
    }"
    role="status"
  >
    <component
      :is="icon"
      v-if="variant !== 'neutral'"
      class="callout-icon"
      :stroke-width="UI_ICON_STROKE"
      aria-hidden="true"
    />
    <div class="callout-body">
      <p v-if="title" class="callout-title">{{ title }}</p>
      <div class="callout-content text-sm leading-relaxed text-stone-600">
        <slot />
      </div>
      <div v-if="$slots.actions" class="callout-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
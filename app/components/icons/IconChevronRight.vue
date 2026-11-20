<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { UI_ICON_STROKE } from './uiIconDefaults'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <ChevronRight v-bind="$attrs" :stroke-width="UI_ICON_STROKE" class="shrink-0" aria-hidden="true" />
</template>
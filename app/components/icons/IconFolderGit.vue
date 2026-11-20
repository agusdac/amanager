<script setup lang="ts">
import { FolderGit2 } from 'lucide-vue-next'
import { UI_ICON_STROKE } from './uiIconDefaults'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <FolderGit2
    v-bind="$attrs"
    :stroke-width="UI_ICON_STROKE"
    class="shrink-0"
    aria-hidden="true"
  />
</template>
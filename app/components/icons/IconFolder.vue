<script setup lang="ts">
import AppIcon from './AppIcon.vue'
</script>

<template>
  <AppIcon v-bind="$attrs">
    <path
      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </AppIcon>
</template>
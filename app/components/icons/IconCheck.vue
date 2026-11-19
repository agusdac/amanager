<script setup lang="ts">
import AppIcon from './AppIcon.vue'
</script>

<template>
  <AppIcon v-bind="$attrs">
    <path
      d="M5 12l4 4L19 6"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </AppIcon>
</template>
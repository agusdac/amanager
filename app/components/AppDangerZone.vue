<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="danger-zone" aria-labelledby="danger-zone-title">
    <div class="danger-zone-marker" aria-hidden="true" />
    <div class="danger-zone-inner">
      <h2 id="danger-zone-title" class="danger-zone-title">{{ title }}</h2>
      <p v-if="description" class="danger-zone-description">{{ description }}</p>
      <div class="danger-zone-actions">
        <slot />
      </div>
    </div>
  </section>
</template>
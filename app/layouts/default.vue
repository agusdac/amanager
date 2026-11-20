<script setup lang="ts">
const route = useRoute()
const { data: session } = useSessionFetch()

const showShell = computed(() => {
  if (!session.value?.user) return false
  const bare = new Set(['/login', '/register', '/forgot-password', '/reset-password'])
  return !bare.has(route.path)
})
</script>

<template>
  <AppShell v-if="showShell">
    <slot />
  </AppShell>
  <div v-else class="min-h-screen bg-surface-muted">
    <slot />
  </div>
</template>
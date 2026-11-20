<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-950">
    <header class="border-b border-rule/80 bg-white/90 px-4 py-4 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/90">
      <div class="mx-auto flex max-w-md items-center justify-center gap-2">
        <IconFolder class="h-5 w-5 text-stone-800 dark:text-stone-200" />
        <NuxtLink
          to="/login"
          class="text-sm font-semibold text-ink no-underline hover:text-stone-700 dark:text-stone-100 dark:hover:text-stone-300"
        >
          {{ t('app.name') }}
        </NuxtLink>
      </div>
    </header>
    <main class="mx-auto max-w-md px-4 py-10">
      <slot />
    </main>
  </div>
</template>
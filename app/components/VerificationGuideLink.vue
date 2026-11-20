<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    inline?: boolean
  }>(),
  { inline: false },
)

const { t } = useI18n()
</script>

<template>
  <NuxtLink
    to="/guide/verification"
    class="text-muted underline decoration-stone-300 underline-offset-2 hover:text-ink"
    :class="inline ? 'text-xs' : 'text-sm'"
  >
    {{ t('guide.verification.openGuide') }}
  </NuxtLink>
</template>
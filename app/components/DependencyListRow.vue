<script setup lang="ts">
const props = defineProps<{
  fromId: string
  fromName: string
  toId: string
  toName: string
  relationType: string
  verificationStatus: string
  edgeDescription?: string | null
  removing?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const { t } = useI18n()

function relationLabel(type: string) {
  const key = `dependencies.relationTypes.${type}`
  const translated = t(key)
  return translated !== key ? translated : type.replaceAll('_', ' ')
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-2 gap-y-2"
    :class="compact ? 'text-sm' : ''"
  >
    <div
      class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-1"
      :class="compact ? 'text-sm' : 'text-sm sm:text-base'"
    >
      <NuxtLink
        :to="`/assets/${fromId}`"
        class="font-medium text-ink underline decoration-stone-300 underline-offset-[0.2em] hover:decoration-stone-600"
      >
        {{ fromName }}
      </NuxtLink>
      <span class="select-none text-faint" aria-hidden="true">→</span>
      <span class="font-normal lowercase text-muted">{{ relationLabel(relationType) }}</span>
      <span class="select-none text-faint" aria-hidden="true">→</span>
      <NuxtLink
        :to="`/assets/${toId}`"
        class="font-medium text-ink underline decoration-stone-300 underline-offset-[0.2em] hover:decoration-stone-600"
      >
        {{ toName }}
      </NuxtLink>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <VerificationChip :status="verificationStatus" />
      <button
        v-if="!compact"
        type="button"
        class="text-xs font-medium text-red-700 underline decoration-red-200 underline-offset-2 hover:decoration-red-500 disabled:opacity-50"
        :disabled="removing"
        @click="emit('remove')"
      >
        {{ t('dependencies.remove') }}
      </button>
    </div>
  </div>
  <p v-if="!compact && edgeDescription" class="mt-1.5 text-sm text-muted">
    {{ edgeDescription }}
  </p>
</template>
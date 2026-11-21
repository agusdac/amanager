<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import type { FavoriteTargetType } from '#shared/schemas/actions'

const props = defineProps<{
  targetType: FavoriteTargetType
  targetId: string
  size?: 'sm' | 'md'
}>()

const { t } = useI18n()
const { ensureLoaded, isFavorited, toggle } = useFavorites()
const busy = ref(false)

onMounted(() => {
  void ensureLoaded()
})

const active = computed(() => isFavorited(props.targetType, props.targetId))

async function onClick() {
  if (busy.value) return
  busy.value = true
  try {
    await toggle(props.targetType, props.targetId)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex shrink-0 items-center justify-center rounded-md text-subtle transition hover:text-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800 dark:focus-visible:outline-stone-300"
    :class="active ? 'text-amber-500' : ''"
    :aria-label="active ? t('favorites.remove') : t('favorites.add')"
    :aria-pressed="active"
    :disabled="busy"
    @click.stop.prevent="onClick"
  >
    <Star
      class="shrink-0"
      :class="size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'"
      :fill="active ? 'currentColor' : 'none'"
    />
  </button>
</template>
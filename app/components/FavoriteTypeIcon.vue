<script setup lang="ts">
import { CheckSquare, Code, Mail, User, Zap } from 'lucide-vue-next'
import type { FavoriteRow } from '~/composables/useFavorites'

const props = defineProps<{
  favorite: FavoriteRow
  dense?: boolean
}>()

const actionKindIcon = computed(() => {
  const k = props.favorite.actionKind
  if (k === 'checklist') return CheckSquare
  if (k === 'reference') return Code
  return Zap
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200"
    :class="dense ? 'h-6 w-6 rounded' : 'h-10 w-10'"
    aria-hidden="true"
  >
    <AssetTypeLabel
      v-if="favorite.targetType === 'asset' && favorite.assetType"
      :type="favorite.assetType"
      dense
      icon-only
    />
    <component
      :is="actionKindIcon"
      v-else-if="favorite.targetType === 'action'"
      :class="dense ? 'h-3 w-3' : 'h-4 w-4'"
    />
    <User v-else-if="favorite.targetType === 'identity'" :class="dense ? 'h-3 w-3' : 'h-4 w-4'" />
    <Mail v-else-if="favorite.targetType === 'email_address'" :class="dense ? 'h-3 w-3' : 'h-4 w-4'" />
    <Zap v-else :class="dense ? 'h-3 w-3' : 'h-4 w-4'" />
  </span>
</template>
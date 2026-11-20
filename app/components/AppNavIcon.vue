<script setup lang="ts">
import {
  BookOpen,
  Boxes,
  BookMarked,
  ClipboardList,
  Home,
  Mail,
  Route,
  Sparkles,
  Upload,
  Users,
} from 'lucide-vue-next'
import { UI_ICON_STROKE } from '~/components/icons/uiIconDefaults'
import type { AppNavItem } from '~/constants/appNav'

const props = defineProps<{
  icon: AppNavItem['icon']
}>()

const glyph = computed(() => {
  const map = {
    home: Home,
    projects: Route,
    accounts: Mail,
    assets: Boxes,
    import: Upload,
    onboarding: Sparkles,
    checklist: ClipboardList,
    guide: BookOpen,
    guides: BookMarked,
    team: Users,
  } as const
  return map[props.icon]
})
</script>

<template>
  <component :is="glyph" class="h-[1.125rem] w-[1.125rem] shrink-0" :stroke-width="UI_ICON_STROKE" aria-hidden="true" />
</template>
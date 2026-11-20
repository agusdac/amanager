<script setup lang="ts">
import type { AppNavItem } from '~/constants/appNav'

const props = defineProps<{
  item: AppNavItem
  collapsed?: boolean
  variant?: 'sidebar' | 'top'
}>()

const { t } = useI18n()
const route = useRoute()

const isActive = computed(() => {
  if (props.item.match === 'exact') return route.path === props.item.to
  return route.path === props.item.to || route.path.startsWith(`${props.item.to}/`)
})
</script>

<template>
  <NuxtLink
    :to="item.to"
    :title="collapsed ? t(item.labelKey) : undefined"
    class="app-nav-link"
    :class="[
      variant === 'top' ? 'app-nav-link--top' : 'app-nav-link--side',
      collapsed && variant !== 'top' ? 'app-nav-link--collapsed' : '',
      isActive ? 'app-nav-link--active' : '',
    ]"
  >
    <AppNavIcon :icon="item.icon" />
    <span v-if="!collapsed || variant === 'top'" class="app-nav-link__label">{{ t(item.labelKey) }}</span>
  </NuxtLink>
</template>
<script setup lang="ts">
import { NAV_PRIMARY, NAV_SECONDARY } from '~/constants/appNav'

const { t } = useI18n()
useSyncUserLocale()
useSyncUserTheme()
const { collapsed, toggle } = useSidebarCollapsed()
const { data: session } = useSessionFetch()
const { projectId, setProject, validateProjectInList } = useWorkspaceScope()
const { pathWithScope } = useScopedNavigation()
const route = useRoute()

const { data: projects } = await useFetch('/api/projects')

const mobileNavOpen = ref(false)
const isMdUp = ref(true)

const projectIds = computed(() => new Set((projects.value?.projects ?? []).map((p) => p.id)))

const showProjectSwitcher = computed(() => {
  const list = projects.value?.projects ?? []
  if (list.length <= 1) return false
  if (projectId.value && !projectIds.value.has(projectId.value)) return false
  return true
})

const sidebarCollapsed = computed(() => collapsed.value && isMdUp.value)

watch(
  projectIds,
  (ids) => {
    if (ids.size) validateProjectInList(ids)
  },
  { immediate: true },
)

watch(
  () => route.path,
  () => {
    mobileNavOpen.value = false
  },
)

function openMobileNav() {
  mobileNavOpen.value = true
}

function closeMobileNav() {
  mobileNavOpen.value = false
}

function onSidebarEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && mobileNavOpen.value) closeMobileNav()
}

let mediaQuery: MediaQueryList | null = null

function syncBreakpoint() {
  if (!mediaQuery) return
  isMdUp.value = mediaQuery.matches
  if (mediaQuery.matches) mobileNavOpen.value = false
}

onMounted(() => {
  clearBodyScrollLocks()
  mediaQuery = window.matchMedia('(min-width: 768px)')
  syncBreakpoint()
  mediaQuery.addEventListener('change', syncBreakpoint)
  document.addEventListener('keydown', onSidebarEscape)
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', syncBreakpoint)
  document.removeEventListener('keydown', onSidebarEscape)
})

const userInitial = computed(() => {
  const name = session.value?.user?.name?.trim()
  if (name) return name.charAt(0).toUpperCase()
  const email = session.value?.user?.email
  return email ? email.charAt(0).toUpperCase() : '?'
})
</script>

<template>
  <div
    class="app-shell"
    :class="{
      'app-shell--collapsed': sidebarCollapsed,
      'app-shell--mobile-nav-open': mobileNavOpen,
    }"
  >
    <button
      v-if="mobileNavOpen"
      type="button"
      class="app-shell__backdrop"
      :aria-label="t('nav.closeMenu')"
      @click="closeMobileNav"
    />

    <aside class="app-shell__sidebar" aria-label="Main navigation">
      <NuxtLink :to="pathWithScope('/home')" class="app-shell__brand" :title="t('app.name')" @click="closeMobileNav">
        <IconFolder class="h-5 w-5 shrink-0 text-stone-800 dark:text-stone-200" />
        <span v-if="!sidebarCollapsed" class="truncate font-semibold text-stone-900 dark:text-stone-100">{{
          t('app.name')
        }}</span>
      </NuxtLink>

      <nav class="app-shell__nav">
        <p v-if="!sidebarCollapsed" class="app-shell__nav-heading">{{ t('nav.sectionPrimary') }}</p>
        <AppShellNavLink
          v-for="item in NAV_PRIMARY"
          :key="item.to"
          :item="item"
          :collapsed="sidebarCollapsed"
          @navigate="closeMobileNav"
        />

        <div class="mt-4 px-2">
          <FavoritesQuickAccess
            variant="sidebar"
            :compact="sidebarCollapsed"
            :max-items="sidebarCollapsed ? 5 : 6"
          />
        </div>

        <p v-if="!sidebarCollapsed" class="app-shell__nav-heading mt-4">{{ t('nav.sectionMore') }}</p>
        <AppShellNavLink
          v-for="item in NAV_SECONDARY"
          :key="item.to"
          :item="item"
          :collapsed="sidebarCollapsed"
          @navigate="closeMobileNav"
        />
      </nav>

      <div class="app-shell__sidebar-footer space-y-2">
        <WorkspaceSwitcher :collapsed="sidebarCollapsed" />
        <button type="button" class="app-shell__collapse-btn hidden md:flex" @click="toggle">
          <IconPanelLeft class="h-[1.125rem] w-[1.125rem]" />
          <span v-if="!sidebarCollapsed">{{ t('nav.collapseSidebar') }}</span>
        </button>
      </div>
    </aside>

    <div class="app-shell__main">
      <header class="app-shell__topbar gap-2 sm:gap-3">
        <button
          type="button"
          class="app-shell__icon-btn md:hidden"
          :aria-label="t('nav.openMenu')"
          :aria-expanded="mobileNavOpen"
          @click="openMobileNav"
        >
          <IconMenu class="h-[1.125rem] w-[1.125rem]" />
        </button>

        <WorkspaceSwitcher compact class="shrink-0 md:hidden" />

        <label v-if="showProjectSwitcher" class="app-shell__project-focus hidden md:block">
          <span class="sr-only">{{ t('workspaceScope.project') }}</span>
          <select
            class="field app-shell__project-select"
            :value="projectId"
            :aria-label="t('workspaceScope.project')"
            @change="setProject(($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ t('workspaceScope.allProjects') }}</option>
            <option v-for="p in projects?.projects ?? []" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>

        <WorkspaceSearch />

        <NuxtLink
          to="/account"
          class="app-shell__user ml-auto"
          :class="{
            'ring-2 ring-stone-800 ring-offset-2 dark:ring-stone-300 dark:ring-offset-stone-900':
              $route.path.startsWith('/account'),
          }"
          :title="t('nav.account')"
        >
          <span class="app-shell__user-avatar" aria-hidden="true">{{ userInitial }}</span>
          <span class="sr-only">{{ t('nav.account') }}</span>
        </NuxtLink>
      </header>

      <main class="app-shell__content">
        <slot />
      </main>
    </div>
  </div>
</template>
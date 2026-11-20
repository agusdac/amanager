<script setup lang="ts">
import { NAV_PRIMARY, NAV_SECONDARY } from '~/constants/appNav'

const { t } = useI18n()
useSyncUserLocale()
useSyncUserTheme()
const { collapsed, toggle } = useSidebarCollapsed()
const { data: session } = useSessionFetch()
const { projectId, setProject, validateProjectInList } = useWorkspaceScope()

const { data: projects } = await useFetch('/api/projects')

const projectIds = computed(() => new Set((projects.value?.projects ?? []).map((p) => p.id)))

const showProjectSwitcher = computed(() => {
  const list = projects.value?.projects ?? []
  if (list.length <= 1) return false
  if (projectId.value && !projectIds.value.has(projectId.value)) return false
  return true
})

watch(
  projectIds,
  (ids) => {
    if (ids.size) validateProjectInList(ids)
  },
  { immediate: true },
)

const userInitial = computed(() => {
  const name = session.value?.user?.name?.trim()
  if (name) return name.charAt(0).toUpperCase()
  const email = session.value?.user?.email
  return email ? email.charAt(0).toUpperCase() : '?'
})
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--collapsed': collapsed }">
    <aside class="app-shell__sidebar" aria-label="Main navigation">
      <NuxtLink to="/home" class="app-shell__brand" :title="t('app.name')">
        <IconFolder class="h-5 w-5 shrink-0 text-stone-800 dark:text-stone-200" />
        <span v-if="!collapsed" class="truncate font-semibold text-stone-900 dark:text-stone-100">{{ t('app.name') }}</span>
      </NuxtLink>

      <nav class="app-shell__nav">
        <p v-if="!collapsed" class="app-shell__nav-heading">{{ t('nav.sectionPrimary') }}</p>
        <AppShellNavLink
          v-for="item in NAV_PRIMARY"
          :key="item.to"
          :item="item"
          :collapsed="collapsed"
        />
        <p v-if="!collapsed" class="app-shell__nav-heading mt-4">{{ t('nav.sectionMore') }}</p>
        <AppShellNavLink
          v-for="item in NAV_SECONDARY"
          :key="item.to"
          :item="item"
          :collapsed="collapsed"
        />
      </nav>

      <div class="app-shell__sidebar-footer space-y-2">
        <WorkspaceSwitcher :collapsed="collapsed" />
        <button type="button" class="app-shell__collapse-btn" @click="toggle">
          <IconPanelLeft class="h-[1.125rem] w-[1.125rem]" />
          <span v-if="!collapsed">{{ t('nav.collapseSidebar') }}</span>
        </button>
      </div>
    </aside>

    <div class="app-shell__main">
      <header class="app-shell__topbar">
        <WorkspaceSwitcher compact class="shrink-0 md:hidden" />
        <label v-if="showProjectSwitcher" class="app-shell__project-focus">
          <span class="sr-only">{{ t('workspaceScope.project') }}</span>
          <select
            class="field max-w-[min(100%,14rem)] py-1.5 text-sm"
            :value="projectId"
            :aria-label="t('workspaceScope.project')"
            @change="setProject(($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ t('workspaceScope.allProjects') }}</option>
            <option v-for="p in projects?.projects ?? []" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>

        <NuxtLink
          to="/account"
          class="app-shell__user"
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
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    collapsed?: boolean
    /** Compact row for mobile top bar */
    compact?: boolean
  }>(),
  { collapsed: false, compact: false },
)

const { t } = useI18n()
const { data: session } = useSessionFetch()

const { data: workspaceData } = await useFetch(
  () => (session.value?.user ? '/api/me/workspaces' : null),
  { watch: [session] },
)

const { switching, switchWorkspace } = useWorkspaceSwitch()

const showSwitcher = computed(
  () => (workspaceData.value?.workspaces ?? []).some((ws) => ws.type === 'team'),
)

function workspaceLabel(ws: { type: string; name: string; role: string }) {
  if (ws.type === 'personal') return t('workspace.personalName')
  return ws.name?.trim() || t('workspace.unnamedTeam')
}

function roleLabel(role: string) {
  const key = `team.roles.${role}` as const
  const label = t(key)
  return label === key ? role : label
}

const currentWorkspaceId = computed(() => session.value?.user?.workspaceId ?? '')

const currentSummary = computed(() => {
  const list = workspaceData.value?.workspaces ?? []
  const ws = list.find((w) => w.id === currentWorkspaceId.value)
  if (!ws) {
    const type = session.value?.user?.workspaceType
    const name =
      type === 'personal'
        ? t('workspace.personalName')
        : (session.value?.user?.workspaceName?.trim() || t('workspace.unnamedTeam'))
    const role = session.value?.user?.workspaceRole ?? ''
    return { name, role, type: type ?? 'personal' }
  }
  return {
    name: workspaceLabel(ws),
    role: roleLabel(ws.role),
    type: ws.type,
  }
})

async function onPick(workspaceId: string) {
  await switchWorkspace(workspaceId)
}
</script>

<template>
  <div
    v-if="showSwitcher"
    class="workspace-switcher"
    :class="{
      'workspace-switcher--collapsed': collapsed && !compact,
      'workspace-switcher--compact': compact,
    }"
  >
    <p v-if="!collapsed && !compact" class="workspace-switcher__heading">
      {{ t('workspace.switcher.heading') }}
    </p>
    <div v-if="collapsed && !compact" class="workspace-switcher__collapsed" :title="currentSummary.name">
      <span class="workspace-switcher__glyph" aria-hidden="true">
        {{ currentSummary.type === 'personal' ? 'P' : 'T' }}
      </span>
      <select
        class="workspace-switcher__select workspace-switcher__select--overlay"
        :disabled="switching"
        :value="currentWorkspaceId"
        :aria-label="t('workspace.switcher.label')"
        @change="onPick(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="ws in workspaceData?.workspaces ?? []"
          :key="ws.id"
          :value="ws.id"
        >
          {{ workspaceLabel(ws) }} · {{ roleLabel(ws.role) }}
        </option>
      </select>
    </div>
    <label v-else class="workspace-switcher__field">
      <span v-if="compact" class="sr-only">{{ t('workspace.switcher.label') }}</span>
      <span v-if="!compact" class="workspace-switcher__current text-xs text-subtle">
        {{ currentSummary.name }}
        <span class="text-faint">· {{ currentSummary.role }}</span>
      </span>
      <select
        class="workspace-switcher__select field"
        :class="compact ? 'py-1.5 text-sm' : 'mt-1 text-sm'"
        :disabled="switching"
        :value="currentWorkspaceId"
        @change="onPick(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="ws in workspaceData?.workspaces ?? []"
          :key="ws.id"
          :value="ws.id"
        >
          {{ workspaceLabel(ws) }} · {{ roleLabel(ws.role) }}
        </option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.workspace-switcher__heading {
  @apply mb-1.5 px-1 text-[0.65rem] font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500;
}

.workspace-switcher__field {
  @apply block w-full px-1;
}

.workspace-switcher__select {
  @apply w-full max-w-none;
}

.workspace-switcher__collapsed {
  @apply relative mx-auto flex h-10 w-10 items-center justify-center;
}

.workspace-switcher__glyph {
  @apply pointer-events-none text-sm font-semibold text-stone-700 dark:text-stone-200;
}

.workspace-switcher__select--overlay {
  @apply absolute inset-0 cursor-pointer opacity-0;
}

</style>
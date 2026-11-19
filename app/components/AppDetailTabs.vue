<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

export type DetailTabItem = {
  id: string
  label: string
  visible?: boolean
}

const props = withDefaults(
  defineProps<{
    tabs: DetailTabItem[]
    defaultTab?: string
    queryKey?: string
    syncQuery?: boolean
  }>(),
  { queryKey: 'tab', syncQuery: true },
)

const route = useRoute()
const router = useRouter()

const visibleTabs = computed(() => props.tabs.filter((t) => t.visible !== false))

const fallbackTab = computed(() => {
  const preferred = props.defaultTab
  if (preferred && visibleTabs.value.some((t) => t.id === preferred)) return preferred
  return visibleTabs.value[0]?.id ?? ''
})

function tabFromRoute(): string {
  if (!props.syncQuery) return fallbackTab.value
  const q = route.query[props.queryKey]
  if (typeof q === 'string' && visibleTabs.value.some((t) => t.id === q)) return q
  if (
    props.queryKey === 'tab' &&
    route.query.view === 'graph' &&
    visibleTabs.value.some((t) => t.id === 'graph')
  ) {
    return 'graph'
  }
  return fallbackTab.value
}

const activeTab = ref(tabFromRoute())

watch(visibleTabs, () => {
  if (!visibleTabs.value.some((t) => t.id === activeTab.value)) {
    activeTab.value = fallbackTab.value
  }
})

watch(
  () => [route.query[props.queryKey], route.query.view],
  () => {
    const next = tabFromRoute()
    if (next !== activeTab.value) activeTab.value = next
  },
)

watch(activeTab, (value) => {
  if (!props.syncQuery || !import.meta.client) return
  const nextQuery: Record<string, string | string[]> = { ...route.query }
  delete nextQuery.view
  if (value === fallbackTab.value) {
    delete nextQuery[props.queryKey]
  } else {
    nextQuery[props.queryKey] = value
  }
  const current = route.query[props.queryKey]
  const currentStr = Array.isArray(current) ? current[0] : current
  const nextStr = nextQuery[props.queryKey] as string | undefined
  if (currentStr === nextStr && route.query.view === undefined) return
  router.replace({ query: nextQuery })
})

onMounted(() => {
  if (route.query.view === 'graph' && activeTab.value === 'graph') {
    router.replace({ query: { ...route.query, tab: 'graph', view: undefined } })
  }
})
</script>

<template>
  <TabsRoot v-model="activeTab" activation-mode="manual" class="space-y-6">
    <div class="detail-tabs-shell">
      <TabsList class="detail-tabs-list" :loop="false">
        <TabsTrigger
          v-for="tab in visibleTabs"
          :key="tab.id"
          :value="tab.id"
          class="detail-tabs-trigger"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>
    </div>

    <TabsContent
      v-for="tab in visibleTabs"
      :key="tab.id"
      :value="tab.id"
      class="detail-tabs-panel focus:outline-none"
    >
      <slot :name="tab.id" />
    </TabsContent>
  </TabsRoot>
</template>
<script setup lang="ts">
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import { relationEdgeColor } from '~/constants/relationGraph'

export type DependencyGraphNode = {
  id: string
  name: string
  type: string
  providerSlug?: string | null
  verificationStatus?: string | null
}

export type DependencyGraphEdge = {
  id: string
  from: string
  to: string
  relationType: string
  verificationStatus?: string | null
}

const props = withDefaults(
  defineProps<{
    nodes: DependencyGraphNode[]
    edges: DependencyGraphEdge[]
    highlightId?: string | null
    storageKey?: string | null
    compact?: boolean
  }>(),
  { highlightId: null, storageKey: null, compact: false },
)

const { t, te } = useI18n()

type SimNode = SimulationNodeDatum &
  DependencyGraphNode & {
    fx?: number | null
    fy?: number | null
  }

type SimLink = SimulationLinkDatum<SimNode> & {
  id: string
  relationType: string
  verificationStatus?: string | null
}

const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

const width = ref(640)
const height = computed(() => (props.compact ? 300 : 460))

const pan = ref({ x: 0, y: 0 })
const scale = ref(1)

const search = ref('')
const neighborhoodOnly = ref(Boolean(props.highlightId))
const onlyUnverified = ref(false)
const hoveredEdgeId = ref<string | null>(null)

const relationTypesInGraph = computed(() => {
  const set = new Set<string>()
  for (const e of props.edges) set.add(e.relationType)
  return [...set].sort()
})

const enabledRelations = ref<Set<string>>(new Set())

watch(
  relationTypesInGraph,
  (types) => {
    enabledRelations.value = new Set(types)
  },
  { immediate: true },
)

watch(
  () => props.highlightId,
  (id) => {
    if (id) neighborhoodOnly.value = true
  },
)

function toggleRelation(type: string) {
  const next = new Set(enabledRelations.value)
  if (next.has(type)) next.delete(type)
  else next.add(type)
  enabledRelations.value = next
}

function relationLabel(type: string) {
  const key = `dependencies.relationTypes.${type}`
  return te(key) ? t(key) : type.replaceAll('_', ' ')
}

const filteredEdges = computed(() => {
  let list = props.edges.filter((e) => enabledRelations.value.has(e.relationType))
  if (onlyUnverified.value) {
    list = list.filter((e) => e.verificationStatus === 'unverified' || e.verificationStatus === 'declared')
  }
  if (neighborhoodOnly.value && props.highlightId) {
    const id = props.highlightId
    list = list.filter((e) => e.from === id || e.to === id)
  }
  return list
})

const visibleNodeIds = computed(() => {
  const ids = new Set<string>()
  if (!neighborhoodOnly.value || !props.highlightId) {
    for (const n of props.nodes) ids.add(n.id)
  }
  for (const e of filteredEdges.value) {
    ids.add(e.from)
    ids.add(e.to)
  }
  return ids
})

const simNodes = ref<SimNode[]>([])
const simLinks = ref<SimLink[]>([])
let simulation: Simulation<SimNode, SimLink> | null = null

function savedPositions(): Record<string, { x: number; y: number }> {
  if (!import.meta.client || !props.storageKey) return {}
  try {
    const raw = localStorage.getItem(props.storageKey)
    return raw ? (JSON.parse(raw) as Record<string, { x: number; y: number }>) : {}
  } catch {
    return {}
  }
}

function persistPositions() {
  if (!import.meta.client || !props.storageKey) return
  const map: Record<string, { x: number; y: number }> = {}
  for (const n of simNodes.value) {
    if (n.x != null && n.y != null) map[n.id] = { x: n.x, y: n.y }
  }
  localStorage.setItem(props.storageKey, JSON.stringify(map))
}

function stopSimulation() {
  simulation?.stop()
  simulation = null
}

function runSimulation() {
  stopSimulation()
  const saved = savedPositions()
  const w = width.value
  const h = height.value

  const nodes: SimNode[] = props.nodes
    .filter((n) => visibleNodeIds.value.has(n.id))
    .map((n, i) => {
      const pos = saved[n.id]
      const angle = (i / Math.max(props.nodes.length, 1)) * Math.PI * 2
      return {
        ...n,
        x: pos?.x ?? w / 2 + Math.cos(angle) * 80,
        y: pos?.y ?? h / 2 + Math.sin(angle) * 80,
      }
    })

  const links: SimLink[] = filteredEdges.value.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    relationType: e.relationType,
    verificationStatus: e.verificationStatus,
  }))

  simulation = forceSimulation(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(110)
        .strength(0.85),
    )
    .force('charge', forceManyBody().strength(-420))
    .force('center', forceCenter(w / 2, h / 2))
    .force('collide', forceCollide(42))
    .alphaDecay(0.04)
    .on('tick', () => {
      simNodes.value = [...nodes]
      simLinks.value = [...links]
    })

  simNodes.value = [...nodes]
  simLinks.value = [...links]
}

watch(
  [filteredEdges, visibleNodeIds, width],
  () => {
    if (import.meta.client) runSimulation()
  },
  { deep: true },
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const el = containerRef.value
  if (el) width.value = Math.max(320, el.clientWidth)
  runSimulation()
  resizeObserver = new ResizeObserver(() => {
    if (containerRef.value) width.value = Math.max(320, containerRef.value.clientWidth)
  })
  if (el) resizeObserver.observe(el)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  stopSimulation()
})


function nodeOpacity(node: SimNode) {
  const q = search.value.trim().toLowerCase()
  if (!q) return 1
  return node.name.toLowerCase().includes(q) ? 1 : 0.22
}

function nodeStroke(node: SimNode) {
  if (props.highlightId === node.id) return '#292524'
  return '#e7e5e4'
}

function nodeFill(node: SimNode) {
  if (props.highlightId === node.id) return '#fafaf9'
  return '#ffffff'
}

function linkOpacity(link: SimLink) {
  if (hoveredEdgeId.value && hoveredEdgeId.value !== link.id) return 0.25
  if (onlyUnverified.value) return 0.95
  return 0.7
}

function linkDash(link: SimLink) {
  const s = link.verificationStatus
  if (s === 'unverified' || s === 'declared') return '6 4'
  return undefined
}

function edgeLabel(link: SimLink) {
  return relationLabel(link.relationType)
}

function linkPath(link: SimLink) {
  const s = link.source as SimNode
  const t = link.target as SimNode
  if (s.x == null || s.y == null || t.x == null || t.y == null) return ''
  return `M${s.x},${s.y} L${t.x},${t.y}`
}

function midPoint(link: SimLink) {
  const s = link.source as SimNode
  const t = link.target as SimNode
  if (s.x == null || s.y == null || t.x == null || t.y == null) return { x: 0, y: 0 }
  return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 }
}

const draggingNode = ref<string | null>(null)

function clientToGraph(clientX: number, clientY: number) {
  const svg = svgRef.value
  if (!svg) return { x: 0, y: 0 }
  const rect = svg.getBoundingClientRect()
  const x = (clientX - rect.left - pan.value.x) / scale.value
  const y = (clientY - rect.top - pan.value.y) / scale.value
  return { x, y }
}

function onNodePointerDown(node: SimNode, event: PointerEvent) {
  event.stopPropagation()
  draggingNode.value = node.id
  node.fx = node.x
  node.fy = node.y
  simulation?.alphaTarget(0.25).restart()

  const move = (ev: PointerEvent) => {
    const pt = clientToGraph(ev.clientX, ev.clientY)
    node.fx = pt.x
    node.fy = pt.y
  }
  const up = () => {
    simulation?.alphaTarget(0)
    node.fx = node.x ?? node.fx
    node.fy = node.y ?? node.fy
    draggingNode.value = null
    persistPositions()
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

const panning = ref(false)
let panStart = { x: 0, y: 0, panX: 0, panY: 0 }

function onSvgPointerDown(event: PointerEvent) {
  if (draggingNode.value) return
  panning.value = true
  panStart = { x: event.clientX, y: event.clientY, panX: pan.value.x, panY: pan.value.y }

  const move = (ev: PointerEvent) => {
    pan.value = {
      x: panStart.panX + (ev.clientX - panStart.x),
      y: panStart.panY + (ev.clientY - panStart.y),
    }
  }
  const up = () => {
    panning.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  const svg = svgRef.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const mx = event.clientX - rect.left
  const my = event.clientY - rect.top
  const k = scale.value
  const delta = -event.deltaY * 0.0012
  const next = Math.min(2.4, Math.max(0.35, k + delta))
  pan.value = {
    x: mx - ((mx - pan.value.x) * next) / k,
    y: my - ((my - pan.value.y) * next) / k,
  }
  scale.value = next
}

function resetLayout() {
  if (props.storageKey && import.meta.client) localStorage.removeItem(props.storageKey)
  runSimulation()
  simulation?.alpha(1).restart()
}

function fitView() {
  const nodes = simNodes.value.filter((n) => n.x != null && n.y != null)
  if (nodes.length === 0) return
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    minX = Math.min(minX, n.x!)
    minY = Math.min(minY, n.y!)
    maxX = Math.max(maxX, n.x!)
    maxY = Math.max(maxY, n.y!)
  }
  const pad = 64
  const bw = maxX - minX + pad * 2
  const bh = maxY - minY + pad * 2
  const k = Math.min(1.6, Math.min(width.value / bw, height.value / bh))
  scale.value = Math.max(0.4, k)
  pan.value = {
    x: width.value / 2 - ((minX + maxX) / 2) * scale.value,
    y: height.value / 2 - ((minY + maxY) / 2) * scale.value,
  }
}

const isEmpty = computed(() => filteredEdges.value.length === 0 && neighborhoodOnly.value)
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <input
        v-model="search"
        type="search"
        class="field max-w-[12rem]"
        :placeholder="t('graph.search')"
        :aria-label="t('graph.search')"
      />
      <label v-if="highlightId" class="inline-flex items-center gap-1.5 text-stone-600">
        <input v-model="neighborhoodOnly" type="checkbox" class="rounded border-stone-300" />
        {{ t('graph.focusNeighbors') }}
      </label>
      <label class="inline-flex items-center gap-1.5 text-stone-600">
        <input v-model="onlyUnverified" type="checkbox" class="rounded border-stone-300" />
        {{ t('graph.onlyUnverified') }}
      </label>
      <button type="button" class="btn-secondary text-xs" @click="resetLayout">
        {{ t('graph.resetLayout') }}
      </button>
      <button type="button" class="btn-secondary text-xs" @click="fitView">
        {{ t('graph.fit') }}
      </button>
    </div>

    <div v-if="relationTypesInGraph.length" class="flex flex-wrap gap-1.5">
      <button
        v-for="rel in relationTypesInGraph"
        :key="rel"
        type="button"
        class="rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
        :class="
          enabledRelations.has(rel)
            ? 'border-stone-300 bg-white text-stone-800 shadow-sm'
            : 'border-transparent bg-stone-100 text-stone-400 line-through'
        "
        :style="enabledRelations.has(rel) ? { borderColor: relationEdgeColor(rel) } : undefined"
        @click="toggleRelation(rel)"
      >
        {{ relationLabel(rel) }}
      </button>
    </div>

    <p class="text-xs text-stone-500">{{ t('graph.hint') }}</p>

    <div
      ref="containerRef"
      class="relative overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white shadow-inner"
      :class="compact ? 'min-h-[300px]' : 'min-h-[460px]'"
    >
      <p
        v-if="isEmpty"
        class="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-stone-500"
      >
        {{ t('graph.empty') }}
      </p>
      <svg
        ref="svgRef"
        :width="width"
        :height="height"
        class="touch-none select-none"
        :class="panning ? 'cursor-grabbing' : 'cursor-grab'"
        role="img"
        :aria-label="t('graph.title')"
        @pointerdown="onSvgPointerDown"
        @wheel="onWheel"
      >
        <defs>
          <marker
            id="dep-arrow"
            viewBox="0 -4 8 8"
            refX="7"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0,-4 L8,0 L0,4" fill="#78716c" />
          </marker>
        </defs>
        <g :transform="`translate(${pan.x},${pan.y}) scale(${scale})`">
          <g class="edges">
            <g
              v-for="link in simLinks"
              :key="link.id"
              @pointerenter="hoveredEdgeId = link.id"
              @pointerleave="hoveredEdgeId = null"
            >
              <path
                :d="linkPath(link)"
                fill="none"
                :stroke="relationEdgeColor(link.relationType)"
                stroke-width="1.75"
                :stroke-dasharray="linkDash(link)"
                :opacity="linkOpacity(link)"
                marker-end="url(#dep-arrow)"
              />
              <text
                v-if="hoveredEdgeId === link.id"
                :x="midPoint(link).x"
                :y="midPoint(link).y - 6"
                text-anchor="middle"
                class="pointer-events-none text-[10px] font-medium"
                fill="#44403c"
              >
                {{ edgeLabel(link) }}
              </text>
            </g>
          </g>
          <g class="nodes">
            <g
              v-for="node in simNodes"
              :key="node.id"
              :transform="`translate(${node.x ?? 0},${node.y ?? 0})`"
              :opacity="nodeOpacity(node)"
              class="cursor-grab"
              @pointerdown="onNodePointerDown(node, $event)"
            >
              <rect
                x="-54"
                y="-22"
                width="108"
                height="44"
                rx="10"
                :fill="nodeFill(node)"
                :stroke="nodeStroke(node)"
                :stroke-width="highlightId === node.id ? 2 : 1"
              />
              <foreignObject x="-50" y="-18" width="100" height="36">
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  class="flex h-full items-center gap-1.5 px-1"
                >
                  <BrandIcon
                    :provider-slug="node.providerSlug"
                    :asset-type="node.type"
                    :size="14"
                    :title="node.name"
                  />
                  <NuxtLink
                    :to="`/assets/${node.id}`"
                    class="truncate text-xs font-medium text-stone-800 hover:underline"
                    @click.stop
                  >
                    {{ node.name }}
                  </NuxtLink>
                </div>
              </foreignObject>
            </g>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>
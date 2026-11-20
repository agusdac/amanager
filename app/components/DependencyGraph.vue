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
const { theme } = useAppTheme()

const graphPalette = computed(() => {
  const dark = theme.value === 'dark'
  return {
    canvasFrom: dark ? '#1c1917' : '#fafaf9',
    canvasTo: dark ? '#0c0a09' : '#ffffff',
    nodeFillDefault: dark ? '#292524' : '#ffffff',
    nodeFillHighlight: dark ? '#44403c' : '#fafaf9',
    nodeFillPopover: dark ? '#422006' : '#fffbeb',
    nodeStrokeDefault: dark ? '#57534e' : '#e7e5e4',
    nodeStrokeHighlight: dark ? '#e7e5e4' : '#292524',
    nodeStrokePopover: '#b45309',
    edgeLabelBg: dark ? 'rgba(28, 25, 23, 0.94)' : 'rgba(255, 255, 255, 0.92)',
    edgeLabelStroke: dark ? '#57534e' : '#e7e5e4',
    edgeLabelText: dark ? '#e7e5e4' : '#44403c',
    arrowFill: dark ? '#a8a29e' : '#78716c',
    nodeLabelClass: dark ? 'truncate text-xs font-medium text-stone-100' : 'truncate text-xs font-medium text-stone-800',
  }
})

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
const viewportHeight = ref(720)
const viewportWidth = ref(1024)

const expanded = ref(false)

const height = computed(() => {
  if (expanded.value) return Math.max(320, viewportHeight.value - 80)
  if (props.compact) return 300
  return 460
})

const pan = ref({ x: 0, y: 0 })
const scale = ref(1)

const search = ref('')
const neighborhoodOnly = ref(Boolean(props.highlightId))
const onlyUnverified = ref(false)
const hoveredEdgeId = ref<string | null>(null)
const pinnedEdgeId = ref<string | null>(null)
let hoverClearTimer: ReturnType<typeof setTimeout> | null = null

type GraphDetailPopover =
  | {
      kind: 'edge'
      edgeId: string
      left: number
      top: number
    }
  | {
      kind: 'node'
      nodeId: string
      left: number
      top: number
    }

const detailPopover = ref<GraphDetailPopover | null>(null)

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

function relationHelp(type: string) {
  const key = `graph.relationHelp.${type}`
  return te(key) ? t(key) : t('graph.relationHelp.other')
}

function typeDescription(type: string) {
  const key = `assets.typeDescriptions.${type}`
  return te(key) ? t(key) : ''
}

function nodeById(id: string) {
  return props.nodes.find((n) => n.id === id) ?? simNodes.value.find((n) => n.id === id)
}

function edgeById(id: string) {
  return filteredEdges.value.find((e) => e.id === id)
}

function isEdgeHighlighted(linkId: string) {
  return pinnedEdgeId.value === linkId || hoveredEdgeId.value === linkId
}

function onEdgePointerEnter(linkId: string) {
  if (hoverClearTimer) {
    clearTimeout(hoverClearTimer)
    hoverClearTimer = null
  }
  hoveredEdgeId.value = linkId
}

function onEdgePointerLeave(linkId: string) {
  if (pinnedEdgeId.value === linkId) return
  hoverClearTimer = setTimeout(() => {
    if (hoveredEdgeId.value === linkId) hoveredEdgeId.value = null
    hoverClearTimer = null
  }, 220)
}

function popoverAtPointer(event: MouseEvent): { left: number; top: number } {
  const el = containerRef.value
  if (!el) return { left: 16, top: 16 }
  const rect = el.getBoundingClientRect()
  const pad = 12
  const maxW = 280
  const maxH = 220
  let left = event.clientX - rect.left + 8
  let top = event.clientY - rect.top + 8
  left = Math.max(pad, Math.min(left, rect.width - maxW - pad))
  top = Math.max(pad, Math.min(top, rect.height - maxH - pad))
  return { left, top }
}

function openEdgeDetail(link: SimLink, event: MouseEvent) {
  event.stopPropagation()
  pinnedEdgeId.value = link.id
  hoveredEdgeId.value = link.id
  const { left, top } = popoverAtPointer(event)
  detailPopover.value = { kind: 'edge', edgeId: link.id, left, top }
}

function openNodeDetail(node: SimNode, event: MouseEvent) {
  event.stopPropagation()
  const { left, top } = popoverAtPointer(event)
  detailPopover.value = { kind: 'node', nodeId: node.id, left, top }
}

function closeDetailPopover() {
  detailPopover.value = null
  pinnedEdgeId.value = null
  hoveredEdgeId.value = null
}

const popoverEdge = computed(() => {
  if (detailPopover.value?.kind !== 'edge') return null
  return edgeById(detailPopover.value.edgeId)
})

const popoverNode = computed(() => {
  if (detailPopover.value?.kind !== 'node') return null
  return nodeById(detailPopover.value.nodeId)
})

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
  [filteredEdges, visibleNodeIds, width, height],
  () => {
    if (import.meta.client) runSimulation()
  },
  { deep: true },
)

function measureViewport() {
  if (!import.meta.client) return
  viewportHeight.value = window.innerHeight
  viewportWidth.value = window.innerWidth
}

function syncCanvasWidth() {
  if (expanded.value) {
    width.value = Math.max(320, viewportWidth.value - 48)
    return
  }
  if (containerRef.value) width.value = Math.max(320, containerRef.value.clientWidth)
}

function toggleExpanded() {
  const entering = !expanded.value
  expanded.value = entering
  if (import.meta.client) {
    document.body.style.overflow = entering ? 'hidden' : ''
  }
  measureViewport()
  nextTick(() => {
    requestAnimationFrame(() => {
      syncCanvasWidth()
      if (entering) {
        fitView({ padding: 76, minScale: 0.55, maxScale: 1.65 })
        runSimulation()
      } else {
        fitView({ padding: 32, minScale: 0.92, maxScale: 1.22 })
      }
    })
  })
}

function onWindowResize() {
  if (!expanded.value) return
  measureViewport()
  syncCanvasWidth()
}

let resizeObserver: ResizeObserver | null = null

function onWindowKeydown(ev: KeyboardEvent) {
  if (ev.key !== 'Escape') return
  if (detailPopover.value) {
    closeDetailPopover()
    return
  }
  if (expanded.value) toggleExpanded()
}

onMounted(() => {
  measureViewport()
  syncCanvasWidth()
  runSimulation()
  resizeObserver = new ResizeObserver(() => {
    if (!expanded.value) syncCanvasWidth()
  })
  const el = containerRef.value
  if (el) resizeObserver.observe(el)
  window.addEventListener('keydown', onWindowKeydown)
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  stopSimulation()
  window.removeEventListener('keydown', onWindowKeydown)
  window.removeEventListener('resize', onWindowResize)
  if (hoverClearTimer) clearTimeout(hoverClearTimer)
  if (import.meta.client) document.body.style.overflow = ''
})


function nodeOpacity(node: SimNode) {
  const q = search.value.trim().toLowerCase()
  if (!q) return 1
  return node.name.toLowerCase().includes(q) ? 1 : 0.22
}

function nodeStroke(node: SimNode) {
  const p = graphPalette.value
  if (detailPopover.value?.kind === 'node' && detailPopover.value.nodeId === node.id) return p.nodeStrokePopover
  if (props.highlightId === node.id) return p.nodeStrokeHighlight
  return p.nodeStrokeDefault
}

function nodeFill(node: SimNode) {
  const p = graphPalette.value
  if (detailPopover.value?.kind === 'node' && detailPopover.value.nodeId === node.id) return p.nodeFillPopover
  if (props.highlightId === node.id) return p.nodeFillHighlight
  return p.nodeFillDefault
}

function linkOpacity(link: SimLink) {
  const active = pinnedEdgeId.value ?? hoveredEdgeId.value
  if (active) return isEdgeHighlighted(link.id) ? 1 : 0.2
  if (onlyUnverified.value) return 0.95
  return 0.72
}

function linkStrokeWidth(link: SimLink) {
  return isEdgeHighlighted(link.id) ? 2.75 : 1.75
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
const nodeDragMoved = ref(false)
let nodeDragStart = { x: 0, y: 0 }

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
  nodeDragMoved.value = false
  nodeDragStart = { x: event.clientX, y: event.clientY }
  node.fx = node.x
  node.fy = node.y
  simulation?.alphaTarget(0.25).restart()

  const move = (ev: PointerEvent) => {
    if (Math.hypot(ev.clientX - nodeDragStart.x, ev.clientY - nodeDragStart.y) > 4) {
      nodeDragMoved.value = true
    }
    const pt = clientToGraph(ev.clientX, ev.clientY)
    node.fx = pt.x
    node.fy = pt.y
  }
  const up = (ev: PointerEvent) => {
    simulation?.alphaTarget(0)
    node.fx = node.x ?? node.fx
    node.fy = node.y ?? node.fy
    draggingNode.value = null
    persistPositions()
    const target = ev.target
    if (!nodeDragMoved.value) openNodeDetail(node, ev)
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

type FitViewOptions = {
  padding?: number
  minScale?: number
  maxScale?: number
}

function fitView(opts: FitViewOptions = {}) {
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
  const pad = opts.padding ?? (expanded.value ? 72 : 40)
  const minScale = opts.minScale ?? (expanded.value ? 0.5 : 0.82)
  const maxScale = opts.maxScale ?? (expanded.value ? 1.65 : 1.25)
  const bw = Math.max(maxX - minX + pad * 2, 120)
  const bh = Math.max(maxY - minY + pad * 2, 120)
  const k = Math.min(width.value / bw, height.value / bh)
  scale.value = Math.max(minScale, Math.min(maxScale, k))
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
      <label v-if="highlightId" class="inline-flex items-center gap-1.5 text-muted">
        <input v-model="neighborhoodOnly" type="checkbox" class="checkbox" />
        {{ t('graph.focusNeighbors') }}
      </label>
      <label class="inline-flex items-center gap-1.5 text-muted">
        <input v-model="onlyUnverified" type="checkbox" class="checkbox" />
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
            ? 'border-stone-300 dark:border-stone-600 bg-surface text-ink shadow-sm'
            : 'border-transparent bg-surface-soft text-faint line-through'
        "
        :style="enabledRelations.has(rel) ? { borderColor: relationEdgeColor(rel) } : undefined"
        @click="toggleRelation(rel)"
      >
        {{ relationLabel(rel) }}
      </button>
    </div>

    <p class="text-xs text-subtle">{{ t('graph.hint') }}</p>

    <div
      v-if="expanded"
      class="fixed inset-0 z-[70] bg-stone-900/40 dark:bg-stone-950/70"
      aria-hidden="true"
      @click="toggleExpanded"
    />

    <div
      ref="containerRef"
      class="graph-canvas-shell relative overflow-hidden rounded-xl border border-rule bg-gradient-to-b from-stone-50 to-white shadow-inner dark:from-stone-900 dark:to-stone-950 dark:shadow-none"
      :class="{ 'graph-canvas-shell--expanded': expanded }"
      :style="{ minHeight: `${height}px` }"
    >
      <button
        type="button"
        class="graph-expand-btn"
        :aria-label="expanded ? t('graph.shrink') : t('graph.enlarge')"
        :title="expanded ? t('graph.shrink') : t('graph.enlarge')"
        @click.stop="toggleExpanded"
      >
        <IconMinimize v-if="expanded" class="h-4 w-4" />
        <IconExpand v-else class="h-4 w-4" />
      </button>
      <p
        v-if="isEmpty"
        class="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-subtle"
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
            <path d="M0,-4 L8,0 L0,4" :fill="graphPalette.arrowFill" />
          </marker>
        </defs>
        <g :transform="`translate(${pan.x},${pan.y}) scale(${scale})`">
          <g class="edges">
            <g
              v-for="link in simLinks"
              :key="link.id"
              class="cursor-pointer"
              @pointerenter="onEdgePointerEnter(link.id)"
              @pointerleave="onEdgePointerLeave(link.id)"
            >
              <path
                :d="linkPath(link)"
                fill="none"
                stroke="transparent"
                stroke-width="18"
                pointer-events="stroke"
                @click="openEdgeDetail(link, $event)"
              />
              <path
                :d="linkPath(link)"
                fill="none"
                :stroke="relationEdgeColor(link.relationType)"
                :stroke-width="linkStrokeWidth(link)"
                :stroke-dasharray="linkDash(link)"
                :opacity="linkOpacity(link)"
                pointer-events="none"
                marker-end="url(#dep-arrow)"
              />
              <template v-if="isEdgeHighlighted(link.id)">
                <rect
                  :x="midPoint(link).x - 52"
                  :y="midPoint(link).y - 22"
                  width="104"
                  height="18"
                  rx="4"
                  :fill="graphPalette.edgeLabelBg"
                  :stroke="graphPalette.edgeLabelStroke"
                  class="pointer-events-none"
                />
                <text
                  :x="midPoint(link).x"
                  :y="midPoint(link).y - 10"
                  text-anchor="middle"
                  class="pointer-events-none text-[10px] font-medium"
                  :fill="graphPalette.edgeLabelText"
                >
                  {{ edgeLabel(link) }}
                </text>
              </template>
            </g>
          </g>
          <g class="nodes">
            <g
              v-for="node in simNodes"
              :key="node.id"
              :transform="`translate(${node.x ?? 0},${node.y ?? 0})`"
              :opacity="nodeOpacity(node)"
              class="cursor-pointer"
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
                  <span :class="graphPalette.nodeLabelClass">
                    {{ node.name }}
                  </span>
                </div>
              </foreignObject>
            </g>
          </g>
        </g>
      </svg>

      <div
        v-if="detailPopover && popoverEdge && detailPopover.kind === 'edge'"
        class="graph-popover"
        :style="{ left: `${detailPopover.left}px`, top: `${detailPopover.top}px` }"
        role="dialog"
        @pointerdown.stop
      >
        <button type="button" class="graph-popover-close" :aria-label="t('common.close')" @click="closeDetailPopover">
          ×
        </button>
        <p class="text-xs font-medium uppercase tracking-wide text-subtle">{{ t('graph.popover.edgeTitle') }}</p>
        <p class="mt-1 text-sm font-semibold text-ink">{{ relationLabel(popoverEdge.relationType) }}</p>
        <p class="mt-2 text-xs leading-relaxed text-muted">{{ relationHelp(popoverEdge.relationType) }}</p>
        <dl class="mt-3 space-y-1.5 text-xs text-ink-secondary">
          <div class="flex justify-between gap-2">
            <dt class="text-subtle">{{ t('graph.popover.from') }}</dt>
            <dd class="text-right font-medium">{{ nodeById(popoverEdge.from)?.name ?? popoverEdge.from }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-subtle">{{ t('graph.popover.to') }}</dt>
            <dd class="text-right font-medium">{{ nodeById(popoverEdge.to)?.name ?? popoverEdge.to }}</dd>
          </div>
          <div class="flex items-center justify-between gap-2">
            <dt class="text-subtle">{{ t('graph.popover.verification') }}</dt>
            <dd><VerificationChip :status="popoverEdge.verificationStatus ?? 'declared'" /></dd>
          </div>
        </dl>
      </div>

      <div
        v-if="detailPopover && popoverNode && detailPopover.kind === 'node'"
        class="graph-popover"
        :style="{ left: `${detailPopover.left}px`, top: `${detailPopover.top}px` }"
        role="dialog"
        @pointerdown.stop
      >
        <button type="button" class="graph-popover-close" :aria-label="t('common.close')" @click="closeDetailPopover">
          ×
        </button>
        <p class="text-xs font-medium uppercase tracking-wide text-subtle">{{ t('graph.popover.nodeTitle') }}</p>
        <p class="mt-1 text-sm font-semibold text-ink">{{ popoverNode.name }}</p>
        <p class="mt-1 text-xs text-muted">
          <AssetTypeLabel :type="popoverNode.type" :provider-slug="popoverNode.providerSlug" :show-icon="true" />
        </p>
        <p v-if="typeDescription(popoverNode.type)" class="mt-2 text-xs leading-relaxed text-muted">
          {{ typeDescription(popoverNode.type) }}
        </p>
        <div class="mt-2 flex items-center gap-2 text-xs">
          <span class="text-subtle">{{ t('graph.popover.verification') }}</span>
          <VerificationChip :status="popoverNode.verificationStatus ?? 'declared'" />
        </div>
        <NuxtLink :to="`/assets/${popoverNode.id}`" class="btn-secondary mt-3 w-full text-center text-xs">
          {{ t('graph.popover.openAsset') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph-canvas-shell--expanded {
  @apply fixed inset-3 z-[80] m-0 rounded-xl border-stone-300 bg-stone-50 shadow-2xl;
  @apply dark:border-stone-600 dark:bg-stone-950;
  max-height: calc(100vh - 1.5rem);
}

.graph-expand-btn {
  @apply absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white/95 text-stone-700 shadow-sm transition-colors;
  @apply hover:bg-stone-50 hover:text-stone-900;
  @apply dark:border-stone-700 dark:bg-stone-900/95 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100;
}

.graph-popover {
  @apply absolute z-20 max-w-[17.5rem] rounded-lg border border-stone-200 bg-white p-4 pr-8 text-stone-900 shadow-lg;
  @apply dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100;
  pointer-events: auto;
}

.graph-popover-close {
  @apply absolute right-2 top-1.5 flex h-7 w-7 items-center justify-center rounded text-lg leading-none text-stone-500 hover:bg-stone-100 hover:text-stone-800;
  @apply dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200;
}
</style>
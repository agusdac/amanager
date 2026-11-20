<script setup lang="ts">
type DepRow = {
  id: string
  relationType: string
  verificationStatus: string
  description: string | null
  peerId: string
  peerName: string
  peerType: string
}

const props = defineProps<{
  assetId: string
  assetName: string
  outbound: DepRow[]
  inbound: DepRow[]
  removingId?: string | null
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const { t } = useI18n()

const confirmOpen = ref(false)
const pendingRemoveId = ref<string | null>(null)

const pendingRow = computed(() => {
  const id = pendingRemoveId.value
  if (!id) return null
  const out = props.outbound.find((d) => d.id === id)
  if (out) {
    return {
      fromId: props.assetId,
      fromName: props.assetName,
      toId: out.peerId,
      toName: out.peerName,
      relationType: out.relationType,
      verificationStatus: out.verificationStatus,
    }
  }
  const inn = props.inbound.find((d) => d.id === id)
  if (!inn) return null
  return {
    fromId: inn.peerId,
    fromName: inn.peerName,
    toId: props.assetId,
    toName: props.assetName,
    relationType: inn.relationType,
    verificationStatus: inn.verificationStatus,
  }
})

function askRemove(id: string) {
  pendingRemoveId.value = id
  confirmOpen.value = true
}

function confirmRemove() {
  if (pendingRemoveId.value) emit('remove', pendingRemoveId.value)
  pendingRemoveId.value = null
}
</script>

<template>
  <section class="card space-y-4 p-6">
    <AppConfirmDialog
      v-model:open="confirmOpen"
      :title="t('dependencies.confirmRemoveTitle')"
      :description="t('dependencies.confirmRemoveDescription')"
      :confirm-label="t('dependencies.remove')"
      @confirm="confirmRemove"
    >
      <div
        v-if="pendingRow"
        class="rounded-lg border border-rule bg-stone-50/90 dark:bg-stone-900/80 dark:bg-stone-900/80 px-3 py-2.5"
      >
        <DependencyListRow
          v-bind="pendingRow"
          compact
        />
      </div>
    </AppConfirmDialog>

    <div>
      <h2 class="section-title">{{ t('assets.sectionDependencies') }}</h2>
      <p class="lede mt-1">{{ t('assets.dependenciesHint') }}</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 class="text-sm font-medium text-ink-secondary">{{ t('assets.depsOutbound') }}</h3>
        <ul v-if="outbound.length" class="list-card mt-2 text-sm">
          <li v-for="d in outbound" :key="d.id" class="px-3 py-3">
            <DependencyListRow
              :from-id="assetId"
              :from-name="assetName"
              :to-id="d.peerId"
              :to-name="d.peerName"
              :relation-type="d.relationType"
              :verification-status="d.verificationStatus"
              :edge-description="d.description"
              :removing="props.removingId === d.id"
              @remove="askRemove(d.id)"
            />
            <span class="mt-1 block text-xs text-subtle">
              <AssetTypeLabel :type="d.peerType" dense />
            </span>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-subtle">{{ t('assets.depsOutboundEmpty') }}</p>
      </div>
      <div>
        <h3 class="text-sm font-medium text-ink-secondary">{{ t('assets.depsInbound') }}</h3>
        <ul v-if="inbound.length" class="list-card mt-2 text-sm">
          <li v-for="d in inbound" :key="d.id" class="px-3 py-3">
            <DependencyListRow
              :from-id="d.peerId"
              :from-name="d.peerName"
              :to-id="assetId"
              :to-name="assetName"
              :relation-type="d.relationType"
              :verification-status="d.verificationStatus"
              :edge-description="d.description"
              :removing="props.removingId === d.id"
              @remove="askRemove(d.id)"
            />
            <span class="mt-1 block text-xs text-subtle">
              <AssetTypeLabel :type="d.peerType" dense />
            </span>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-subtle">{{ t('assets.depsInboundEmpty') }}</p>
      </div>
    </div>
  </section>
</template>
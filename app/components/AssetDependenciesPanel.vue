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
  outbound: DepRow[]
  inbound: DepRow[]
  removingId?: string | null
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const { t } = useI18n()

function askRemove(id: string) {
  if (!import.meta.client || !window.confirm(t('dependencies.confirmDelete'))) return
  emit('remove', id)
}

function relationLabel(type: string) {
  const key = `dependencies.relationTypes.${type}`
  const translated = t(key)
  return translated !== key ? translated : type.replaceAll('_', ' ')
}
</script>

<template>
  <section class="card space-y-4 p-6">
    <div>
      <h2 class="section-title">{{ t('assets.sectionDependencies') }}</h2>
      <p class="lede mt-1">{{ t('assets.dependenciesHint') }}</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 class="text-sm font-medium text-stone-700">{{ t('assets.depsOutbound') }}</h3>
        <ul v-if="outbound.length" class="list-card mt-2 text-sm">
          <li v-for="d in outbound" :key="d.id" class="space-y-1 px-3 py-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium text-stone-800">{{ relationLabel(d.relationType) }}</span>
              <div class="flex items-center gap-2">
                <VerificationChip :status="d.verificationStatus" />
                <button
                  type="button"
                  class="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                  :disabled="props.removingId === d.id"
                  @click="askRemove(d.id)"
                >
                  {{ t('dependencies.remove') }}
                </button>
              </div>
            </div>
            <NuxtLink :to="`/assets/${d.peerId}`" class="text-stone-900 underline">
              {{ d.peerName }}
            </NuxtLink>
            <span class="ml-2 text-stone-500"><AssetTypeLabel :type="d.peerType" /></span>
            <p v-if="d.description" class="text-stone-600">{{ d.description }}</p>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-stone-500">{{ t('assets.depsOutboundEmpty') }}</p>
      </div>
      <div>
        <h3 class="text-sm font-medium text-stone-700">{{ t('assets.depsInbound') }}</h3>
        <ul v-if="inbound.length" class="list-card mt-2 text-sm">
          <li v-for="d in inbound" :key="d.id" class="space-y-1 px-3 py-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium text-stone-800">{{ relationLabel(d.relationType) }}</span>
              <div class="flex items-center gap-2">
                <VerificationChip :status="d.verificationStatus" />
                <button
                  type="button"
                  class="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                  :disabled="props.removingId === d.id"
                  @click="askRemove(d.id)"
                >
                  {{ t('dependencies.remove') }}
                </button>
              </div>
            </div>
            <NuxtLink :to="`/assets/${d.peerId}`" class="text-stone-900 underline">
              {{ d.peerName }}
            </NuxtLink>
            <span class="ml-2 text-stone-500"><AssetTypeLabel :type="d.peerType" /></span>
            <p v-if="d.description" class="text-stone-600">{{ d.description }}</p>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-stone-500">{{ t('assets.depsInboundEmpty') }}</p>
      </div>
    </div>
  </section>
</template>
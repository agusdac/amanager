<script setup lang="ts">
const { t } = useI18n()
const csv = ref(`project,provider,asset_type,asset_name,login_email,environment,admin_url,notes
Mini Críptico,github,repository,web repo,,production,,placeholder`)
const preview = ref<Record<string, unknown> | null>(null)
const batchId = ref('')

async function runPreview() {
  preview.value = await $fetch('/api/import/preview', { method: 'POST', body: { csv: csv.value } })
}

async function runCommit() {
  const res = await $fetch<{ batchId: string }>('/api/import/commit', { method: 'POST', body: { csv: csv.value } })
  batchId.value = res.batchId
}

async function revert() {
  if (!batchId.value) return
  await $fetch(`/api/import/${batchId.value}/revert`, { method: 'POST' })
  batchId.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-semibold">{{ t('import.title') }}</h1>
    <textarea v-model="csv" rows="10" class="w-full rounded border p-3 font-mono text-xs" />
    <div class="flex gap-2">
      <button type="button" class="rounded border px-3 py-2 text-sm" @click="runPreview">{{ t('import.preview') }}</button>
      <button type="button" class="rounded bg-stone-900 px-3 py-2 text-sm text-white" @click="runCommit">{{ t('import.commit') }}</button>
      <button v-if="batchId" type="button" class="rounded border px-3 py-2 text-sm text-red-700" @click="revert">{{ t('import.revert') }}</button>
    </div>
    <pre v-if="preview" class="overflow-auto rounded border bg-stone-50 p-3 text-xs">{{ JSON.stringify(preview, null, 2) }}</pre>
  </div>
</template>
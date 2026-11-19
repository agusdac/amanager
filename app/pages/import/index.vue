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
    <h1 class="page-title">{{ t('import.title') }}</h1>
    <textarea v-model="csv" rows="10" spellcheck="false" class="field font-mono text-xs" />
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn-secondary" @click="runPreview">{{ t('import.preview') }}</button>
      <button type="button" class="btn-primary" @click="runCommit">{{ t('import.commit') }}</button>
      <button v-if="batchId" type="button" class="btn-danger" @click="revert">{{ t('import.revert') }}</button>
    </div>
    <pre v-if="preview" class="card overflow-auto bg-stone-50 p-3 font-mono text-xs text-stone-800">{{ JSON.stringify(preview, null, 2) }}</pre>
  </div>
</template>
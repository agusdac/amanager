<script setup lang="ts">
import type { AssetAttributes } from '../../shared/schemas/assetAttributes'
import {
  ASSET_TYPE_ATTRIBUTE_FIELDS,
  projectDomainFromWebsite,
} from '~/constants/assetTypeFields'

const props = defineProps<{
  assetType: string
  attributes: AssetAttributes | null | undefined
  projectWebsiteUrl?: string | null
}>()

const emit = defineEmits<{
  save: [attributes: AssetAttributes]
}>()

const { t } = useI18n()

const fields = computed(() => ASSET_TYPE_ATTRIBUTE_FIELDS[props.assetType] ?? [])

const local = ref<AssetAttributes>({})

watch(
  () => [props.attributes, props.assetType, props.projectWebsiteUrl] as const,
  () => {
    const next: AssetAttributes = { ...(props.attributes ?? {}) }
    for (const f of fields.value) {
      if (f.inheritFromProjectDomain && !next[f.key]) {
        const derived = projectDomainFromWebsite(props.projectWebsiteUrl)
        if (derived) next[f.key] = derived
      }
    }
    local.value = next
  },
  { immediate: true, deep: true },
)

function save() {
  emit('save', { ...local.value })
}
</script>

<template>
  <section v-if="fields.length" class="card mt-6 p-6">
    <h2 class="text-sm font-medium text-ink-secondary">{{ t('assets.typeSpecificFields') }}</h2>
    <p class="mt-1 text-xs text-subtle">{{ t('assets.typeSpecificFieldsHint') }}</p>
    <form class="form-grid mt-4" @submit.prevent="save">
      <label v-for="field in fields" :key="field.key" class="form-field">
        <span class="label">{{ t(field.labelKey) }}</span>
        <input
          v-model="local[field.key]"
          :type="field.input === 'url' ? 'url' : 'text'"
          class="field font-mono text-sm"
          :placeholder="field.placeholderKey ? t(field.placeholderKey) : undefined"
        />
        <p
          v-if="field.inheritFromProjectDomain && projectWebsiteUrl"
          class="mt-1 text-xs text-subtle"
        >
          {{ t('assets.inheritProjectDomainHint', { domain: projectDomainFromWebsite(projectWebsiteUrl) }) }}
        </p>
      </label>
      <div class="sm:col-span-2">
        <button type="submit" class="btn-secondary">{{ t('assets.saveTypeFields') }}</button>
      </div>
    </form>
  </section>
</template>
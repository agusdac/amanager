<script setup lang="ts">
import {
  assetTypeBadgeClass,
  assetTypeGlyph,
  assetTypeUsesVectorIcon,
} from '~/constants/assetTypeBadge'
import { resolveBrandIcon } from '~/constants/brandIcons'

const props = withDefaults(
  defineProps<{
    type: string
    providerSlug?: string | null
    showDescription?: boolean
    showIcon?: boolean
    /** Table/list density: brand icon without extra frame padding. */
    dense?: boolean
  }>(),
  { showDescription: false, showIcon: true, providerSlug: null, dense: false },
)

const { t, te } = useI18n()

const label = computed(() => {
  const key = `assets.types.${props.type}`
  if (te(key)) return t(key)
  return props.type.replaceAll('_', ' ')
})

const description = computed(() => {
  const key = `assets.typeDescriptions.${props.type}`
  if (te(key)) return t(key)
  return ''
})

const hasBrandIcon = computed(() => !!resolveBrandIcon(props.providerSlug, props.type))

const iconClass = computed(() => assetTypeBadgeClass(props.type))
const glyph = computed(() => assetTypeGlyph(props.type))
const useVectorIcon = computed(() => assetTypeUsesVectorIcon(props.type))
</script>

<template>
  <span class="inline-flex items-center gap-1.5 align-middle">
    <BrandIcon
      v-if="showIcon && hasBrandIcon"
      :provider-slug="providerSlug"
      :asset-type="type"
      :title="label"
      :size="16"
      :framed="!dense"
    />
    <span
      v-else-if="showIcon"
      class="inline-flex h-5 w-5 items-center justify-center rounded"
      :class="iconClass"
      aria-hidden="true"
    >
      <IconFolderGit v-if="useVectorIcon && type === 'repository'" :size="13" />
      <span v-else class="px-0.5 text-[10px] font-semibold leading-none">{{ glyph }}</span>
    </span>
    <span>{{ label }}</span>
    <span
      v-if="showDescription && description"
      class="ml-1 text-subtle"
      :title="description"
    >
      ⓘ
    </span>
  </span>
</template>
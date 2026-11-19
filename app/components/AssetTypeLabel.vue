<script setup lang="ts">
import { resolveBrandIcon } from '~/constants/brandIcons'

const props = withDefaults(
  defineProps<{
    type: string
    providerSlug?: string | null
    showDescription?: boolean
    showIcon?: boolean
  }>(),
  { showDescription: false, showIcon: true, providerSlug: null },
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

const iconClass = computed(() => {
  const map: Record<string, string> = {
    service: 'bg-violet-100 text-violet-800',
    domain: 'bg-sky-100 text-sky-800',
    hosting: 'bg-amber-100 text-amber-900',
    repository: 'bg-stone-200 text-stone-800',
    dns: 'bg-cyan-100 text-cyan-900',
    email: 'bg-pink-100 text-pink-900',
    other: 'bg-stone-100 text-stone-700',
  }
  return map[props.type] ?? 'bg-stone-100 text-stone-700'
})

const glyph = computed(() => {
  const map: Record<string, string> = {
    service: '◆',
    domain: '◎',
    hosting: '▣',
    repository: '{ }',
    dns: '↯',
    email: '@',
    vps: '⬡',
    mail_hosting: '✉',
    object_storage: '☁',
    transactional_email: '➤',
    other: '…',
  }
  return map[props.type] ?? '·'
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5 align-middle">
    <BrandIcon
      v-if="showIcon && hasBrandIcon"
      :provider-slug="providerSlug"
      :asset-type="type"
      :title="label"
      :size="16"
    />
    <span
      v-else-if="showIcon"
      class="inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[10px] font-semibold leading-none"
      :class="iconClass"
      aria-hidden="true"
    >
      {{ glyph }}
    </span>
    <span>{{ label }}</span>
    <span
      v-if="showDescription && description"
      class="ml-1 text-stone-500"
      :title="description"
    >
      ⓘ
    </span>
  </span>
</template>
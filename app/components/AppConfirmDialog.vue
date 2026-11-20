<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'default'
    autoClose?: boolean
  }>(),
  { variant: 'danger', autoClose: true },
)

const emit = defineEmits<{
  confirm: []
}>()

const { t } = useI18n()

const confirmClass = computed(() =>
  props.variant === 'danger'
    ? 'inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
    : 'btn-primary',
)

function onConfirm() {
  emit('confirm')
  if (props.autoClose) open.value = false
}
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-[100] bg-stone-900/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-[101] w-[min(calc(100vw-2rem),26rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-stone-200 bg-white p-6 shadow-2xl shadow-stone-900/10 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <AlertDialogTitle class="text-lg font-semibold tracking-tight text-stone-900">
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription
          v-if="description"
          class="mt-3 text-sm leading-relaxed text-stone-600"
        >
          {{ description }}
        </AlertDialogDescription>
        <div v-if="$slots.default" class="mt-4">
          <slot />
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <AlertDialogCancel
            class="btn-secondary min-h-[2.5rem] rounded-lg px-4 py-2.5"
          >
            {{ cancelLabel ?? t('common.cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction :class="confirmClass" @click.prevent="onConfirm">
            {{ confirmLabel ?? t('common.remove') }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
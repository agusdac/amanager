<script setup lang="ts">
import { KeyRound } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

const props = withDefaults(
  defineProps<{
    modelValue: string
    titleKey?: string
    hintKey?: string
    size?: 'sm' | 'md'
  }>(),
  { titleKey: 'assets.vaultLinkDialogTitle', hintKey: 'assets.vaultLinkPerAccessHint', size: 'sm' },
)

const emit = defineEmits<{ 'update:modelValue': [v: string]; save: [] }>()

const { t } = useI18n()
const open = ref(false)
const draft = ref(props.modelValue)
const saving = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (!open.value) draft.value = v
  },
)

watch(open, (isOpen) => {
  if (isOpen) draft.value = props.modelValue
})

const hasLink = computed(() => !!props.modelValue?.trim())

async function onSave() {
  emit('update:modelValue', draft.value)
  saving.value = true
  try {
    emit('save')
    open.value = false
  } finally {
    saving.value = false
  }
}

const btnClass = computed(() =>
  props.size === 'sm'
    ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors'
    : 'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
)
</script>

<template>
  <DialogRoot v-model:open="open">
    <button
      type="button"
      :class="[
        btnClass,
        hasLink
          ? 'border-stone-400 bg-stone-100 text-stone-800 dark:border-stone-500 dark:bg-stone-800 dark:text-stone-100'
          : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800',
      ]"
      :title="hasLink ? t('assets.vaultLinkEdit') : t('assets.vaultLinkAdd')"
      :aria-label="hasLink ? t('assets.vaultLinkEdit') : t('assets.vaultLinkAdd')"
      @click="open = true"
    >
      <KeyRound class="h-4 w-4" :stroke-width="1.75" aria-hidden="true" />
    </button>

    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[100] bg-stone-900/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-[101] w-[min(calc(100vw-2rem),26rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-surface p-6 shadow-2xl focus:outline-none"
      >
        <DialogTitle class="text-lg font-semibold text-ink">{{ t(titleKey) }}</DialogTitle>
        <DialogDescription class="mt-2 text-sm leading-relaxed text-subtle">
          {{ t(hintKey) }}
        </DialogDescription>
        <label class="mt-4 block text-sm">
          <span class="label">{{ t('assets.passwordManagerItemUrl') }}</span>
          <input
            v-model="draft"
            type="url"
            class="field mt-1.5 font-mono text-sm"
            placeholder="bitwarden://… or https://vault.example/…"
          />
        </label>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <DialogClose as-child>
            <button type="button" class="btn-secondary">{{ t('common.cancel') }}</button>
          </DialogClose>
          <button type="button" class="btn-primary" :disabled="saving" @click="onSave">
            {{ t('assets.savePasswordManagerLink') }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
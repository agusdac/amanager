<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  hintKey?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [v: string]; save: [] }>()

const { t } = useI18n()
const local = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    local.value = v
  },
)

function onInput() {
  emit('update:modelValue', local.value)
}
</script>

<template>
  <label class="block text-sm sm:col-span-2">
    <span class="label">{{ t('assets.passwordManagerItemUrl') }}</span>
    <p class="mt-0.5 text-xs text-subtle">
      {{ hintKey ? t(hintKey) : t('assets.passwordManagerItemUrlHint') }}
    </p>
    <input
      v-model="local"
      type="url"
      class="field mt-1.5 font-mono text-sm"
      placeholder="bitwarden://… or https://vault.example/…"
      @input="onInput"
    />
    <button type="button" class="mt-2 text-xs text-muted underline" @click="emit('save')">
      {{ t('assets.savePasswordManagerLink') }}
    </button>
  </label>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string | null
    disabled?: boolean
    nullable?: boolean
  }>(),
  { disabled: false, nullable: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const { t } = useI18n()
const { data, pending } = useWorkspaceMembers()

function onChange(event: Event) {
  const v = (event.target as HTMLSelectElement).value
  emit('update:modelValue', v === '' ? null : v)
}
</script>

<template>
  <select
    class="field mt-1.5"
    :disabled="disabled || pending"
    :value="modelValue ?? ''"
    @change="onChange"
  >
    <option v-if="nullable" value="">{{ t('assignee.none') }}</option>
    <option v-for="m in data?.members ?? []" :key="m.userId" :value="m.userId">
      {{ m.name }} ({{ m.role }})
    </option>
  </select>
</template>
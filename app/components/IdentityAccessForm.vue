<script setup lang="ts">
const ACCESS_ROLES = ['admin', 'operator', 'owner', 'developer', 'viewer', 'other'] as const

const props = defineProps<{
  identityId: string
}>()

const emit = defineEmits<{
  linked: []
}>()

const { t } = useI18n()
const { data: assets } = await useFetch('/api/assets?limit=200')

const assetId = ref('')
const roleType = ref<(typeof ACCESS_ROLES)[number]>('admin')
const warning = ref('')
const error = ref('')

const assetOptions = computed(() => assets.value?.assets ?? [])

async function linkRole() {
  warning.value = ''
  error.value = ''
  if (!assetId.value) {
    warning.value = t('identityDetail.pickAssetRequired')
    return
  }
  try {
    await $fetch('/api/asset-roles', {
      method: 'POST',
      body: { assetId: assetId.value, identityId: props.identityId, roleType: roleType.value },
    })
    assetId.value = ''
    emit('linked')
  } catch (e: unknown) {
    error.value = formatApiError(e)
  }
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <label class="block text-sm sm:col-span-2">
      <span class="label">{{ t('identityDetail.linkAsset') }}</span>
      <select v-model="assetId" class="field mt-1.5">
        <option value="">{{ t('identityDetail.pickAsset') }}</option>
        <option v-for="a in assetOptions" :key="a.id" :value="a.id">{{ a.name }}</option>
      </select>
    </label>
    <label class="block text-sm">
      <span class="label">{{ t('assets.accessRole') }}</span>
      <select v-model="roleType" class="field mt-1.5">
        <option v-for="role in ACCESS_ROLES" :key="role" :value="role">{{ t(`assets.roles.${role}`) }}</option>
      </select>
    </label>
    <div class="flex items-end">
      <button type="button" class="btn-secondary" @click="linkRole">
        {{ t('identityDetail.linkAccess') }}
      </button>
    </div>
    <p v-if="warning" class="text-sm text-amber-800 dark:text-amber-300 sm:col-span-2">{{ warning }}</p>
    <p v-if="error" class="error-text sm:col-span-2">{{ error }}</p>
  </div>
</template>
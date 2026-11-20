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
const loginEmail = ref('')
const error = ref('')

const assetOptions = computed(() => assets.value?.assets ?? [])

async function linkRole() {
  error.value = ''
  if (!assetId.value) return
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

async function linkEmail() {
  error.value = ''
  const address = loginEmail.value.trim()
  if (!address) return
  try {
    await $fetch('/api/email-addresses', {
      method: 'POST',
      body: { address, identityId: props.identityId, purpose: 'login' },
    })
    loginEmail.value = ''
    emit('linked')
  } catch (e: unknown) {
    error.value = formatApiError(e)
  }
}
</script>

<template>
  <div class="mt-4 grid gap-4 border-t border-rule-light pt-4 sm:grid-cols-2">
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
      <button type="button" class="btn-secondary" :disabled="!assetId" @click="linkRole">
        {{ t('identityDetail.linkAccess') }}
      </button>
    </div>
    <label class="block text-sm sm:col-span-2">
      <span class="label">{{ t('assets.loginEmail') }}</span>
      <input v-model="loginEmail" type="email" class="field mt-1.5" :placeholder="t('identityDetail.emailPlaceholder')" />
    </label>
    <button type="button" class="btn-primary sm:col-span-2 sm:w-fit" :disabled="!loginEmail.trim()" @click="linkEmail">
      {{ t('assets.linkLoginEmail') }}
    </button>
    <p v-if="error" class="error-text sm:col-span-2">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    mode: 'asset' | 'identity'
    assetId?: string
    /** When linking from an asset, optionally tie the same address to this identity. */
    tieIdentityId?: string | null
    identityId?: string
    /** Lowercase addresses already linked on this asset (login). */
    linkedOnAssetAddresses?: string[]
  }>(),
  { linkedOnAssetAddresses: () => [] },
)

const emit = defineEmits<{
  linked: []
}>()

const { t } = useI18n()
const { data: workspaceEmails, refresh: refreshWorkspaceEmails } = await useFetch('/api/email-addresses')

const addressInput = ref('')
const pickedExisting = ref('')
const warning = ref('')
const success = ref('')
const error = ref('')
const successShowsEmailsLink = ref(false)

watch(pickedExisting, (address) => {
  if (address) addressInput.value = address
})

const linkedSet = computed(() => new Set(props.linkedOnAssetAddresses.map((a) => a.trim().toLowerCase())))

async function submit() {
  warning.value = ''
  success.value = ''
  error.value = ''
  successShowsEmailsLink.value = false
  const address = addressInput.value.trim()
  if (!address) {
    warning.value = t('assets.loginEmailRequired')
    return
  }
  if (props.mode === 'asset' && linkedSet.value.has(address.toLowerCase())) {
    warning.value = t('assets.loginEmailAlreadyLinkedOnAsset')
    return
  }
  try {
    if (props.mode === 'asset') {
      if (!props.assetId) return
      const res = await $fetch<{
        workspaceEmailCreated: boolean
        email: { address: string }
      }>('/api/asset-emails', {
        method: 'POST',
        body: {
          assetId: props.assetId,
          address,
          purpose: 'login',
          identityId: props.tieIdentityId || null,
        },
      })
      successShowsEmailsLink.value = res.workspaceEmailCreated
      success.value = res.workspaceEmailCreated
        ? t('assets.linkEmailCreatedInWorkspace', { email: res.email.address })
        : t('assets.linkEmailLinkedExisting', { email: res.email.address })
    } else {
      if (!props.identityId) return
      const res = await $fetch<{
        workspaceEmailCreated: boolean
        email: { address: string }
      }>('/api/identity-emails', {
        method: 'POST',
        body: {
          identityId: props.identityId,
          address,
          purpose: 'login',
        },
      })
      successShowsEmailsLink.value = res.workspaceEmailCreated
      success.value = res.workspaceEmailCreated
        ? t('identityDetail.loginEmailCreatedInWorkspace', { email: res.email.address })
        : t('identityDetail.loginEmailLinkedExisting', { email: res.email.address })
    }
    addressInput.value = ''
    pickedExisting.value = ''
    await refreshWorkspaceEmails()
    emit('linked')
  } catch (e: unknown) {
    error.value = formatApiError(e)
  }
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs text-subtle">{{ t('assets.linkEmailWorkspaceHint') }}</p>
    <label v-if="workspaceEmails?.emails?.length" class="block text-sm">
      <span class="label">{{ t('assets.pickExistingEmail') }}</span>
      <select v-model="pickedExisting" class="field mt-1.5">
        <option value="">{{ t('assets.typeNewEmail') }}</option>
        <option
          v-for="em in workspaceEmails.emails"
          :key="em.id"
          :value="em.address"
          :disabled="mode === 'asset' && linkedSet.has(em.address.trim().toLowerCase())"
        >
          {{
            em.label ? `${em.address} — ${em.label}` : em.address
          }}{{
            mode === 'asset' && linkedSet.has(em.address.trim().toLowerCase())
              ? ` (${t('assets.identityEmailAlreadyOnAsset')})`
              : ''
          }}
        </option>
      </select>
    </label>
    <label class="block text-sm">
      <span class="label">{{ t('assets.loginEmail') }}</span>
      <input v-model="addressInput" type="email" class="field mt-1.5" autocomplete="email" />
    </label>
    <button type="button" class="btn-primary w-full sm:w-fit" @click="submit">
      {{ t('assets.linkLoginEmail') }}
    </button>
    <p v-if="warning" class="text-sm text-amber-800 dark:text-amber-300">{{ warning }}</p>
    <p v-if="success" class="text-sm text-emerald-800 dark:text-emerald-300">
      {{ success }}
      <NuxtLink
        v-if="successShowsEmailsLink"
        to="/accounts?tab=emails"
        class="ml-1 font-medium underline"
      >
        {{ t('assets.viewWorkspaceEmails') }}
      </NuxtLink>
    </p>
    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>
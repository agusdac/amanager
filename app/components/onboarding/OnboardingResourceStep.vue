<script setup lang="ts">
import { ASSET_TYPE_KEYS } from '~/constants/inventory'

const ROLE_TYPES = ['admin', 'owner', 'operator', 'developer', 'billing', 'viewer', 'other'] as const
const ASSET_TYPES = ASSET_TYPE_KEYS

export type OnboardingResourceDraft = {
  key: string
  providerSlug: string
  name: string
  type: string
  enabled: boolean
  identitySource: 'new' | 'existing'
  identityRef: string
  identityLabel: string
  loginEmail: string
  roleType: (typeof ROLE_TYPES)[number]
  verificationStatus: 'declared' | 'confirmed_by_human'
  linkLoginEmail: boolean
}

export type PriorIdentityOption = {
  ref: string
  label: string
  providerSlug: string
  loginEmail: string
  fromResourceName: string
}

const props = defineProps<{
  resource: OnboardingResourceDraft
  providerName: string
  index: number
  total: number
  roleHint?: string
  defaultIdentityLabel: string
  priorIdentities: PriorIdentityOption[]
  providerOptions: { slug: string; name: string }[]
  isCustom: boolean
  canCopyPrevious: boolean
}>()

const emit = defineEmits<{
  'update:resource': [OnboardingResourceDraft]
  copyPrevious: []
}>()

const { t } = useI18n()

function patch(partial: Partial<OnboardingResourceDraft>) {
  emit('update:resource', { ...props.resource, ...partial })
}

function onIdentitySource(source: 'new' | 'existing') {
  if (source === 'new') {
    patch({
      identitySource: 'new',
      identityRef: '',
      identityLabel: props.resource.identityLabel || props.defaultIdentityLabel,
    })
    return
  }
  const first = props.priorIdentities[0]
  if (first) applyExistingIdentity(first.ref)
  else patch({ identitySource: 'existing' })
}

function applyExistingIdentity(ref: string) {
  const opt = props.priorIdentities.find((p) => p.ref === ref)
  if (!opt) return
  patch({
    identitySource: 'existing',
    identityRef: ref,
    identityLabel: opt.label,
    loginEmail: opt.loginEmail,
    linkLoginEmail: Boolean(opt.loginEmail.trim()),
  })
}
</script>

<template>
  <div class="space-y-5">
  <p class="text-sm font-medium text-ink">
    {{ isCustom ? t('onboarding.customResource') : providerName || resource.name }}
  </p>

  <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
    <input
      :checked="resource.enabled"
      type="checkbox"
      class="checkbox"
      @change="patch({ enabled: ($event.target as HTMLInputElement).checked })"
    />
    {{ t('onboarding.includeResource') }}
  </label>

  <template v-if="resource.enabled">
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block text-sm sm:col-span-2">
        <span class="font-medium text-ink-secondary">{{ t('onboarding.assetResourceName') }}</span>
        <input
          :value="resource.name"
          type="text"
          class="field-wizard mt-1.5"
          @input="patch({ name: ($event.target as HTMLInputElement).value })"
        />
      </label>
      <label class="block text-sm sm:col-span-2">
        <span class="font-medium text-ink-secondary">{{ t('assets.type') }}</span>
        <select
          class="field-wizard mt-1.5"
          :value="resource.type"
          @change="patch({ type: ($event.target as HTMLSelectElement).value })"
        >
          <option v-for="ty in ASSET_TYPES" :key="ty" :value="ty">{{ t(`assets.types.${ty}`) }}</option>
        </select>
      </label>
      <label v-if="isCustom" class="block text-sm sm:col-span-2">
        <span class="font-medium text-ink-secondary">{{ t('onboarding.identityProvider') }}</span>
        <span class="ml-1 font-normal text-faint">· {{ t('common.optional') }}</span>
        <select
          class="field-wizard mt-1.5"
          :value="resource.providerSlug"
          @change="patch({ providerSlug: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">{{ t('accounts.noProvider') }}</option>
          <option v-for="p in providerOptions" :key="p.slug" :value="p.slug">{{ p.name }}</option>
        </select>
      </label>
    </div>

    <p v-if="roleHint" class="text-xs text-subtle">{{ roleHint }}</p>

    <fieldset class="space-y-3 border-t border-rule-light pt-4">
      <legend class="text-sm font-semibold text-ink">{{ t('onboarding.resourceSignIn') }}</legend>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm transition-colors"
          :class="
            resource.identitySource === 'new'
              ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-200 dark:bg-stone-100 dark:text-ink'
              : 'border-rule text-muted hover:bg-surface-muted'
          "
          @click="onIdentitySource('new')"
        >
          {{ t('onboarding.identitySourceNew') }}
        </button>
        <button
          v-if="priorIdentities.length"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm transition-colors"
          :class="
            resource.identitySource === 'existing'
              ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-200 dark:bg-stone-100 dark:text-ink'
              : 'border-rule text-muted hover:bg-surface-muted'
          "
          @click="onIdentitySource('existing')"
        >
          {{ t('onboarding.identitySourceExisting') }}
        </button>
      </div>

      <template v-if="resource.identitySource === 'existing'">
        <label class="block text-sm">
          <span class="font-medium text-ink-secondary">{{ t('onboarding.pickExistingIdentity') }}</span>
          <select
            class="field-wizard mt-1.5"
            :value="resource.identityRef"
            @change="applyExistingIdentity(($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ t('onboarding.assetAccessIdentityPick') }}</option>
            <option v-for="opt in priorIdentities" :key="opt.ref" :value="opt.ref">
              {{ opt.label }}{{ opt.fromResourceName ? ` — ${opt.fromResourceName}` : '' }}
            </option>
          </select>
        </label>
      </template>
      <template v-else>
        <label class="block text-sm">
          <span class="font-medium text-ink-secondary">{{ t('onboarding.identityLabel') }}</span>
          <input
            :value="resource.identityLabel"
            type="text"
            class="field-wizard mt-1.5"
            :placeholder="defaultIdentityLabel"
            @input="patch({ identityLabel: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="block text-sm">
          <span class="font-medium text-ink-secondary">{{ t('onboarding.identityLoginEmail') }}</span>
          <span class="ml-1 font-normal text-faint">· {{ t('common.optional') }}</span>
          <input
            :value="resource.loginEmail"
            type="email"
            class="field-wizard mt-1.5"
            :placeholder="t('onboarding.identityLoginEmailPlaceholder')"
            @input="patch({ loginEmail: ($event.target as HTMLInputElement).value })"
          />
        </label>
      </template>

      <label class="block text-sm">
        <span class="font-medium text-ink-secondary">{{ t('assets.accessRole') }}</span>
        <select
          class="field-wizard mt-1.5"
          :value="resource.roleType"
          @change="patch({ roleType: ($event.target as HTMLSelectElement).value as OnboardingResourceDraft['roleType'] })"
        >
          <option v-for="role in ROLE_TYPES" :key="role" :value="role">
            {{ t(`assets.roles.${role}`) }}
          </option>
        </select>
      </label>

      <label
        v-if="resource.loginEmail.trim()"
        class="flex cursor-pointer items-start gap-2 text-sm text-muted"
      >
        <input
          :checked="resource.linkLoginEmail"
          type="checkbox"
          class="checkbox mt-0.5"
          @change="patch({ linkLoginEmail: ($event.target as HTMLInputElement).checked })"
        />
        <span>{{ t('onboarding.assetAccessLinkEmail', { email: resource.loginEmail.trim() }) }}</span>
      </label>
    </fieldset>

    <fieldset class="space-y-2">
      <legend class="text-sm font-medium text-ink-secondary">{{ t('onboarding.assetAccessVerification') }}</legend>
      <label class="flex cursor-pointer items-start gap-2 rounded-lg border border-rule px-3 py-2.5 text-sm">
        <input
          type="radio"
          class="mt-1 shrink-0"
          :name="`onb-verification-${resource.key}`"
          :checked="resource.verificationStatus === 'declared'"
          @change="patch({ verificationStatus: 'declared' })"
        />
        <span class="font-medium text-ink">{{ t('onboarding.assetAccessVerifyDeclared') }}</span>
      </label>
      <label class="flex cursor-pointer items-start gap-2 rounded-lg border border-rule px-3 py-2.5 text-sm">
        <input
          type="radio"
          class="mt-1 shrink-0"
          :name="`onb-verification-${resource.key}`"
          :checked="resource.verificationStatus === 'confirmed_by_human'"
          @change="patch({ verificationStatus: 'confirmed_by_human' })"
        />
        <span class="font-medium text-ink">{{ t('onboarding.assetAccessVerifyConfirmed') }}</span>
      </label>
    </fieldset>

    <button
      v-if="canCopyPrevious"
      type="button"
      class="text-sm font-medium text-ink-secondary underline hover:text-ink"
      @click="emit('copyPrevious')"
    >
      {{ t('onboarding.assetAccessCopyPrevious') }}
    </button>
  </template>
  </div>
</template>
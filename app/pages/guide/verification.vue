<script setup lang="ts">
import { VERIFICATION_METHOD_KEYS, VERIFICATION_STATUS_KEYS } from '~/constants/inventory'

const { t, te } = useI18n()
useAppPageTitle('pageTitles.guideVerification')

const statusKeys = VERIFICATION_STATUS_KEYS
const methodKeys = VERIFICATION_METHOD_KEYS

function methodExample(key: string) {
  const k = `guide.verification.methodExamples.${key}`
  return te(k) ? t(k) : ''
}
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-2">
      <NuxtLink to="/assets?verification=needs_confirmation" class="text-sm text-muted underline">
        {{ t('guide.verification.backToQueue') }}
      </NuxtLink>
      <h1 class="page-title">{{ t('guide.verification.title') }}</h1>
      <p class="lede">{{ t('guide.verification.lede') }}</p>
    </header>

    <section class="card space-y-4 p-6">
      <h2 class="section-title">{{ t('guide.verification.statusesTitle') }}</h2>
      <p class="text-sm text-muted">{{ t('guide.verification.statusesIntro') }}</p>
      <ul class="space-y-4 text-sm">
        <li
          v-for="key in statusKeys"
          :key="key"
          class="rounded-lg border border-rule bg-stone-50/80 dark:bg-stone-900/80 px-4 py-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <VerificationChip :status="key" />
            <span class="font-medium text-ink">{{ t(`guide.verification.statusNames.${key}`) }}</span>
          </div>
          <p class="mt-2 text-muted">{{ t(`guide.verification.statusBodies.${key}`) }}</p>
        </li>
      </ul>
    </section>

    <section class="card space-y-4 p-6">
      <h2 class="section-title">{{ t('guide.verification.methodsTitle') }}</h2>
      <p class="text-sm text-muted">{{ t('guide.verification.methodsIntro') }}</p>
      <ul class="divide-y divide-rule border border-rule rounded-lg bg-surface text-sm">
        <li v-for="key in methodKeys" :key="key" class="px-4 py-3">
          <p class="font-medium text-ink">{{ t(`verificationMethods.${key}`) }}</p>
          <p class="mt-1 text-muted">{{ t(`guide.verification.methodBodies.${key}`) }}</p>
          <p v-if="methodExample(key)" class="mt-1 text-xs text-subtle">{{ methodExample(key) }}</p>
        </li>
      </ul>
    </section>

    <section class="card space-y-3 p-6">
      <h2 class="section-title">{{ t('guide.verification.flowTitle') }}</h2>
      <ol class="list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
        <li>{{ t('guide.verification.flowSteps.0') }}</li>
        <li>{{ t('guide.verification.flowSteps.1') }}</li>
        <li>{{ t('guide.verification.flowSteps.2') }}</li>
        <li>{{ t('guide.verification.flowSteps.3') }}</li>
      </ol>
      <p class="text-sm text-muted">{{ t('guide.verification.flowNote') }}</p>
    </section>
  </div>
</template>
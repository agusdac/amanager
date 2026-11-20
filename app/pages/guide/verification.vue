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
      <NuxtLink to="/assets?verification=needs_confirmation" class="text-sm text-stone-600 underline">
        {{ t('guide.verification.backToQueue') }}
      </NuxtLink>
      <h1 class="page-title">{{ t('guide.verification.title') }}</h1>
      <p class="lede">{{ t('guide.verification.lede') }}</p>
    </header>

    <section class="card space-y-4 p-6">
      <h2 class="section-title">{{ t('guide.verification.statusesTitle') }}</h2>
      <p class="text-sm text-stone-600">{{ t('guide.verification.statusesIntro') }}</p>
      <ul class="space-y-4 text-sm">
        <li
          v-for="key in statusKeys"
          :key="key"
          class="rounded-lg border border-stone-200 bg-stone-50/80 px-4 py-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <VerificationChip :status="key" />
            <span class="font-medium text-stone-900">{{ t(`guide.verification.statusNames.${key}`) }}</span>
          </div>
          <p class="mt-2 text-stone-600">{{ t(`guide.verification.statusBodies.${key}`) }}</p>
        </li>
      </ul>
    </section>

    <section class="card space-y-4 p-6">
      <h2 class="section-title">{{ t('guide.verification.methodsTitle') }}</h2>
      <p class="text-sm text-stone-600">{{ t('guide.verification.methodsIntro') }}</p>
      <ul class="divide-y divide-stone-100 border border-stone-200 rounded-lg bg-white text-sm">
        <li v-for="key in methodKeys" :key="key" class="px-4 py-3">
          <p class="font-medium text-stone-900">{{ t(`verificationMethods.${key}`) }}</p>
          <p class="mt-1 text-stone-600">{{ t(`guide.verification.methodBodies.${key}`) }}</p>
          <p v-if="methodExample(key)" class="mt-1 text-xs text-stone-500">{{ methodExample(key) }}</p>
        </li>
      </ul>
    </section>

    <section class="card space-y-3 p-6">
      <h2 class="section-title">{{ t('guide.verification.flowTitle') }}</h2>
      <ol class="list-decimal space-y-2 pl-5 text-sm text-stone-700">
        <li>{{ t('guide.verification.flowSteps.0') }}</li>
        <li>{{ t('guide.verification.flowSteps.1') }}</li>
        <li>{{ t('guide.verification.flowSteps.2') }}</li>
        <li>{{ t('guide.verification.flowSteps.3') }}</li>
      </ol>
      <p class="text-sm text-stone-600">{{ t('guide.verification.flowNote') }}</p>
    </section>
  </div>
</template>
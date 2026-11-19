<script setup lang="ts">
const { t } = useI18n()
const { data: session, refresh } = await useFetch('/api/auth/session', { key: 'session' })

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refresh()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-stone-200 bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <NuxtLink to="/home" class="flex items-center gap-2 font-semibold text-stone-900">
          <IconFolder class="h-5 w-5" />
          <span>{{ t('app.name') }}</span>
        </NuxtLink>
        <nav class="flex flex-wrap items-center gap-4 text-sm text-stone-600">
          <NuxtLink v-if="session?.user" to="/home" class="hover:text-stone-900">{{ t('nav.home') }}</NuxtLink>
          <NuxtLink v-if="session?.user" to="/projects" class="hover:text-stone-900">{{ t('nav.projects') }}</NuxtLink>
          <NuxtLink v-if="session?.user" to="/accounts" class="hover:text-stone-900">{{ t('nav.accounts') }}</NuxtLink>
          <NuxtLink v-if="session?.user" to="/assets" class="hover:text-stone-900">{{ t('nav.assets') }}</NuxtLink>
          <NuxtLink v-if="session?.user" to="/onboarding" class="hover:text-stone-900">{{ t('nav.onboarding') }}</NuxtLink>
          <LocaleSwitcher />
          <button
            v-if="session?.user"
            type="button"
            class="hover:text-stone-900"
            @click="logout"
          >
            {{ t('nav.logout') }}
          </button>
          <NuxtLink v-else to="/login" class="hover:text-stone-900">{{ t('nav.login') }}</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
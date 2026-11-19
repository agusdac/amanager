<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const options = computed(() =>
  (locales.value as { code: string; name: string }[]).map((l) => ({
    code: l.code,
    name: l.name,
  })),
)

async function pick(code: string) {
  await setLocale(code)
}
</script>

<template>
  <div class="flex gap-1 rounded-md border border-stone-200 bg-white p-0.5 text-sm">
    <button
      v-for="opt in options"
      :key="opt.code"
      type="button"
      class="rounded px-2 py-1 transition"
      :class="locale === opt.code ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'"
      @click="pick(opt.code)"
    >
      {{ opt.code.toUpperCase() }}
    </button>
  </div>
</template>
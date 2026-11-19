import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

/** Sets `document.title` to «{page} · {app name}» with i18n-aware keys (`pageTitles.*`). */
export function useAppPageTitle(title: MaybeRefOrGetter<string>) {
  const { t } = useI18n()

  useHead({
    title: computed(() => {
      const raw = toValue(title)
      const page = raw.startsWith('pageTitles.') || raw.startsWith('nav.') ? t(raw) : raw
      return `${page} · ${t('app.name')}`
    }),
  })
}
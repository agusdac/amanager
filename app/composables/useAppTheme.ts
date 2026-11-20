import type { AppTheme } from '~/constants/theme'
import { isAppTheme, THEME_COOKIE } from '~/constants/theme'

/** Cookie + `html.dark` — call once from `app.vue`. */
export function useAppTheme() {
  const cookie = useCookie<string>(THEME_COOKIE, {
    default: () => 'light',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  const resolved = computed<AppTheme>(() =>
    isAppTheme(cookie.value) && cookie.value === 'dark' ? 'dark' : 'light',
  )

  function applyTheme(theme: AppTheme) {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }

  function setTheme(theme: AppTheme) {
    cookie.value = theme
    applyTheme(theme)
  }

  watch(resolved, (theme) => applyTheme(theme), { immediate: true })

  useHead({
    htmlAttrs: {
      class: computed(() => (resolved.value === 'dark' ? 'dark' : undefined)),
    },
  })

  return { theme: resolved, setTheme }
}
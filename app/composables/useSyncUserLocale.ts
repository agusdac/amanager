/** Apply signed-in user's DB locale to vue-i18n (call once from AppShell). */
export function useSyncUserLocale() {
  const { locale, setLocale } = useI18n()
  const { data: session } = useSessionFetch()

  watch(
    () => session.value?.user?.locale,
    (userLocale) => {
      if (!userLocale || userLocale === locale.value) return
      if (userLocale === 'en' || userLocale === 'es') setLocale(userLocale)
    },
    { immediate: true },
  )
}
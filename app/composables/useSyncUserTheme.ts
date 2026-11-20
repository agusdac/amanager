import { isAppTheme } from '~/constants/theme'

/** Apply signed-in user's DB theme to cookie + document (call from AppShell). */
export function useSyncUserTheme() {
  const { setTheme } = useAppTheme()
  const { data: session } = useSessionFetch()

  watch(
    () => session.value?.user?.theme,
    (userTheme) => {
      if (!userTheme || !isAppTheme(userTheme)) return
      setTheme(userTheme)
    },
    { immediate: true },
  )
}
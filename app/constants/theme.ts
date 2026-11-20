export const THEME_COOKIE = 'hilko_theme'

export const appThemes = ['light', 'dark'] as const
export type AppTheme = (typeof appThemes)[number]

export function isAppTheme(value: string): value is AppTheme {
  return (appThemes as readonly string[]).includes(value)
}
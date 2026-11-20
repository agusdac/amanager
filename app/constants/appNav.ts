export type AppNavItem = {
  to: string
  labelKey: string
  /** lucide icon name consumed by AppNavIcon */
  icon:
    | 'home'
    | 'projects'
    | 'accounts'
    | 'assets'
    | 'import'
    | 'onboarding'
    | 'checklist'
    | 'guide'
  match?: 'exact' | 'prefix'
}

export const NAV_PRIMARY: AppNavItem[] = [
  { to: '/home', labelKey: 'nav.home', icon: 'home', match: 'exact' },
  { to: '/accounts', labelKey: 'nav.accounts', icon: 'accounts', match: 'prefix' },
  { to: '/projects', labelKey: 'nav.projects', icon: 'projects' },
  { to: '/assets', labelKey: 'nav.assets', icon: 'assets' },
]

export const NAV_SECONDARY: AppNavItem[] = [
  { to: '/import', labelKey: 'nav.import', icon: 'import' },
  { to: '/onboarding', labelKey: 'nav.onboarding', icon: 'onboarding' },
  { to: '/checklist', labelKey: 'nav.checklist', icon: 'checklist' },
  { to: '/guide/verification', labelKey: 'nav.verificationGuide', icon: 'guide' },
]
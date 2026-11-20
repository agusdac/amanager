/** Asset types rendered as vector icons inside the badge (not text glyphs). */
export const ASSET_TYPE_VECTOR_ICON = new Set(['repository'])

/** Type glyph badges (Field Notebook chips) — always include light + dark pairs. */
export const ASSET_TYPE_BADGE_CLASS: Record<string, string> = {
  service: 'bg-violet-100 text-violet-900 dark:bg-violet-950/55 dark:text-violet-300',
  domain: 'bg-sky-100 text-sky-900 dark:bg-sky-950/55 dark:text-sky-300',
  hosting: 'bg-amber-100 text-amber-950 dark:bg-amber-950/55 dark:text-amber-300',
  hosting_account: 'bg-amber-100 text-amber-950 dark:bg-amber-950/55 dark:text-amber-300',
  server: 'bg-orange-100 text-orange-900 dark:bg-orange-950/55 dark:text-orange-300',
  repository:
    'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
  dns: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/55 dark:text-cyan-300',
  email: 'bg-pink-100 text-pink-900 dark:bg-pink-950/55 dark:text-pink-300',
  oauth_client: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/55 dark:text-indigo-300',
  youtube_channel: 'bg-red-100 text-red-900 dark:bg-red-950/55 dark:text-red-300',
  search_console: 'bg-blue-100 text-blue-900 dark:bg-blue-950/55 dark:text-blue-300',
  google_ads: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/55 dark:text-emerald-300',
  vps: 'bg-lime-100 text-lime-900 dark:bg-lime-950/55 dark:text-lime-300',
  mail_hosting: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950/55 dark:text-fuchsia-300',
  object_storage: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200',
  transactional_email: 'bg-teal-100 text-teal-900 dark:bg-teal-950/55 dark:text-teal-300',
  payment_service: 'bg-green-100 text-green-900 dark:bg-green-950/55 dark:text-green-300',
  ai_service: 'bg-violet-100 text-violet-900 dark:bg-violet-950/55 dark:text-violet-300',
  password_manager: 'bg-rose-100 text-rose-900 dark:bg-rose-950/55 dark:text-rose-300',
  design_tool: 'bg-pink-100 text-pink-900 dark:bg-pink-950/55 dark:text-pink-300',
  other: 'bg-surface-soft text-ink-secondary',
}

export const ASSET_TYPE_GLYPH: Record<string, string> = {
  service: '◆',
  domain: '◎',
  hosting: '▣',
  hosting_account: '▣',
  server: '▣',
  dns: '↯',
  email: '@',
  oauth_client: '◎',
  youtube_channel: '▶',
  search_console: '⌕',
  google_ads: '$',
  vps: '⬡',
  mail_hosting: '✉',
  object_storage: '☁',
  transactional_email: '➤',
  payment_service: '¤',
  ai_service: '✦',
  password_manager: '⬢',
  design_tool: '◇',
  other: '…',
}

export function assetTypeBadgeClass(type: string): string {
  return ASSET_TYPE_BADGE_CLASS[type] ?? ASSET_TYPE_BADGE_CLASS.other
}

export function assetTypeGlyph(type: string): string {
  return ASSET_TYPE_GLYPH[type] ?? '·'
}

export function assetTypeUsesVectorIcon(type: string): boolean {
  return ASSET_TYPE_VECTOR_ICON.has(type)
}
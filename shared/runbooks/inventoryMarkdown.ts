export type AssetLineInput = {
  id: string
  name: string
  type: string
  adminUrl?: string | null
  publicUrl?: string | null
  verificationStatus: string
  providerSlug?: string | null
}

const SETTLED_VERIFICATION = new Set([
  'confirmed_by_human',
  'verified_by_integration',
  'confirmed',
  'verified',
])

const TYPE_LABEL_EN: Record<string, string> = {
  vps: 'VPS',
  oauth_client: 'OAuth client',
  repository: 'Repository',
  dns: 'DNS',
  domain: 'Domain',
}

const TYPE_LABEL_ES: Record<string, string> = {
  vps: 'VPS',
  oauth_client: 'Cliente OAuth',
  repository: 'Repositorio',
  dns: 'DNS',
  domain: 'Dominio',
}

const COPY = {
  en: {
    placeholder: 'placeholder in inventory',
    needsConfirmation: 'confirm in Hilko before handoff',
  },
  es: {
    placeholder: 'provisional en inventario',
    needsConfirmation: 'confirmar en Hilko antes del handoff',
  },
} as const

export function isAssetVerificationSettled(status: string) {
  return SETTLED_VERIFICATION.has(status)
}

export function splitPlaceholderAssetName(name: string): { displayName: string; isPlaceholder: boolean } {
  const trimmed = name.trim()
  const match = trimmed.match(/^(.*)\s+\(placeholder\)\s*$/i)
  if (match) {
    const base = match[1].trim()
    return { displayName: base || trimmed, isPlaceholder: true }
  }
  return { displayName: trimmed, isPlaceholder: false }
}

export function assetTypeLabel(type: string, locale: keyof typeof COPY = 'en'): string {
  const map = locale === 'es' ? TYPE_LABEL_ES : TYPE_LABEL_EN
  if (map[type]) return map[type]
  return type
    .split('_')
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export function assetMarkdownLink(id: string, name: string): string {
  return `[${name}](/assets/${id})`
}

/** Single bullet line for runbook Markdown (no duplicate type in asset name). */
export function formatAssetMarkdownLine(asset: AssetLineInput, locale: keyof typeof COPY = 'en'): string {
  const copy = COPY[locale]
  const { displayName, isPlaceholder } = splitPlaceholderAssetName(asset.name)
  const typeLabel = assetTypeLabel(asset.type, locale)
  const link = assetMarkdownLink(asset.id, displayName)

  const tail: string[] = [typeLabel]
  if (asset.providerSlug) tail.push(asset.providerSlug)

  const urls = [asset.adminUrl, asset.publicUrl].filter(Boolean)
  if (urls.length) tail.push(urls.join(' · '))

  let line = `- ${link} · ${tail.join(' · ')}`

  const notes: string[] = []
  if (isPlaceholder) notes.push(copy.placeholder)
  if (!isAssetVerificationSettled(asset.verificationStatus)) notes.push(copy.needsConfirmation)
  if (notes.length) line += `\n  — _${notes.join(' · ')}_`

  return line
}
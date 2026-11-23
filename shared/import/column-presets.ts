import { ASSET_CANONICAL_HEADERS } from './contract'

/** Headers that map to themselves when present in the file (Hilko export + bundle contract). */
const CANON_BY_LOWER = new Map(
  ASSET_CANONICAL_HEADERS.map((c) => [c.toLowerCase(), c] as const),
)

/** Aliases from spreadsheets / Notion / Confluence (case-insensitive). */
const HEADER_ALIASES: Record<string, string> = {
  nombre: 'asset_name',
  name: 'asset_name',
  recurso: 'asset_name',
  asset: 'asset_name',
  servicio: 'asset_name',
  service: 'asset_name',
  proveedor: 'provider',
  tipo: 'asset_type',
  type: 'asset_type',
  'asset type': 'asset_type',
  proyecto: 'project',
  entorno: 'environment',
  email: 'login_email',
  'login email': 'login_email',
  correo: 'login_email',
  url: 'admin_url',
  link: 'admin_url',
  notas: 'notes',
  descripción: 'notes',
  description: 'notes',
  'external id': 'external_id',
}

export const REQUIRED_ASSET_COLUMNS = ['provider', 'asset_type', 'asset_name'] as const

export function suggestColumnMap(headers: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const h of headers) {
    const key = h.trim().toLowerCase()
    const canon = CANON_BY_LOWER.get(key)
    if (canon) {
      out[h] = canon
      continue
    }
    const alias = HEADER_ALIASES[key]
    if (alias) out[h] = alias
  }
  return out
}

export function resolvedHeaders(headers: string[], columnMap: Record<string, string>): Set<string> {
  const out = new Set<string>()
  for (const h of headers) {
    const mapped = (columnMap[h]?.trim() || h).toLowerCase()
    out.add(mapped)
  }
  return out
}

export function missingRequiredColumns(headers: string[], columnMap: Record<string, string>): string[] {
  const resolved = resolvedHeaders(headers, columnMap)
  return REQUIRED_ASSET_COLUMNS.filter((c) => !resolved.has(c))
}

export function headerNeedsManualMapping(header: string, columnMap: Record<string, string>): boolean {
  const dest = (columnMap[header]?.trim() || header).toLowerCase()
  return !CANON_BY_LOWER.has(dest) && !HEADER_ALIASES[header.trim().toLowerCase()]
}
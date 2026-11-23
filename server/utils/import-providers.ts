import { normalizeProviderSlug } from './import-keys'

export type ProviderCatalogRow = { id: string; slug: string; name: string }

export type ProviderCatalogIndex = {
  bySlug: Set<string>
  idBySlug: Map<string, string>
  slugByKey: Map<string, string>
}

export function buildProviderCatalogIndex(rows: ProviderCatalogRow[]): ProviderCatalogIndex {
  const bySlug = new Set(rows.map((p) => p.slug))
  const idBySlug = new Map(rows.map((p) => [p.slug, p.id]))
  const slugByKey = new Map<string, string>()
  for (const p of rows) {
    slugByKey.set(p.slug, p.slug)
    slugByKey.set(p.slug.toLowerCase(), p.slug)
    slugByKey.set(p.name.toLowerCase(), p.slug)
    slugByKey.set(normalizeProviderSlug(p.name), p.slug)
  }
  return { bySlug, idBySlug, slugByKey }
}

export function resolveProviderSlug(
  raw: string,
  index: ProviderCatalogIndex,
): { slug: string; recognized: boolean } {
  const trimmed = raw.trim()
  if (!trimmed) return { slug: '', recognized: true }
  const norm = normalizeProviderSlug(trimmed)
  if (index.bySlug.has(norm)) return { slug: norm, recognized: true }
  const fromKey = index.slugByKey.get(trimmed.toLowerCase()) ?? index.slugByKey.get(norm)
  if (fromKey) return { slug: fromKey, recognized: true }
  return { slug: norm, recognized: false }
}

export function resolveProviderId(raw: string, index: ProviderCatalogIndex): string | null {
  const { slug, recognized } = resolveProviderSlug(raw, index)
  if (!slug) return null
  if (!recognized) return null
  return index.idBySlug.get(slug) ?? null
}
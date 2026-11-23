import type { CsvRow } from './csv'
import { slugify } from './slug'

export function normalizeProviderSlug(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, '-')
}

export function projectKeyFromRow(row: CsvRow, fallback: string): string {
  const p = (row.project_slug || row.project || fallback).trim()
  return slugify(p || fallback)
}

export function assetKeyFromRow(row: CsvRow, projectKey: string): string {
  const explicit = row.asset_key?.trim()
  if (explicit) return `${projectKey}::${explicit}`
  const provider = normalizeProviderSlug(row.provider ?? '')
  const type = (row.asset_type ?? 'other').trim().toLowerCase()
  const name = (row.asset_name ?? '').trim().toLowerCase()
  return `${projectKey}::${provider}|${type}|${name}`
}

export function assetMatchKey(params: {
  projectKey: string
  providerSlug: string
  assetType: string
  assetName: string
  externalId?: string
}): string {
  if (params.externalId?.trim()) {
    return `ext:${params.externalId.trim()}`
  }
  return `comp:${params.projectKey}|${params.providerSlug}|${params.assetType.toLowerCase()}|${params.assetName.toLowerCase()}`
}
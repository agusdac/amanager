import { ASSET_TYPE_KEYS } from '../../shared/schemas/inventory'
import type { NormalizedAssetRow } from './import-duplicates'
import type { ProviderCatalogIndex } from './import-providers'
import { resolveProviderSlug } from './import-providers'

export type ImportRowError = { rowIndex: number; message: string }

const VERIFICATION = new Set(['unverified', 'declared', 'confirmed_by_human', 'verified_by_integration'])

export type ValidateAssetRowsResult = {
  errors: ImportRowError[]
  warnings: ImportRowError[]
}

export function validateAssetRows(
  rows: NormalizedAssetRow[],
  providerIndex: ProviderCatalogIndex,
): ValidateAssetRowsResult {
  const errors: ImportRowError[] = []
  const warnings: ImportRowError[] = []
  const validTypes = new Set<string>(ASSET_TYPE_KEYS)

  for (const r of rows) {
    const name = r.row.asset_name?.trim()
    if (!name) errors.push({ rowIndex: r.rowIndex, message: 'missing_asset_name' })
    const type = r.row.asset_type?.trim() || 'other'
    if (!validTypes.has(type)) errors.push({ rowIndex: r.rowIndex, message: 'invalid_asset_type' })
    const prov = r.row.provider?.trim()
    if (prov) {
      const resolved = resolveProviderSlug(prov, providerIndex)
      if (!resolved.recognized) {
        warnings.push({ rowIndex: r.rowIndex, message: 'unknown_provider' })
      }
    }
    const ver = r.row.verification_status?.trim()
    if (ver && !VERIFICATION.has(ver)) {
      errors.push({ rowIndex: r.rowIndex, message: 'invalid_verification_status' })
    }
  }
  return { errors, warnings }
}
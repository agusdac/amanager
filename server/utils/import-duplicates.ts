import type { ImportPreviewDuplicate, ImportTarget } from '../../shared/import/contract'
import type { CsvRow } from './csv'
import { assetKeyFromRow, assetMatchKey, normalizeProviderSlug, projectKeyFromRow } from './import-keys'

export type ExistingAssetMatch = {
  id: string
  name: string
  externalIdentifier: string | null
  adminUrl: string | null
  publicUrl: string | null
  description: string | null
  verificationStatus: string
  projectId: string
  projectSlug: string
}

export type NormalizedAssetRow = {
  rowIndex: number
  row: CsvRow
  projectKey: string
  matchKey: string
  assetKey: string
}

const MERGE_OVERWRITE = new Set(['description', 'adminUrl', 'publicUrl', 'verificationStatus'])

function isEmpty(v: string | null | undefined) {
  return v == null || String(v).trim() === ''
}

export function normalizeAssetRows(
  rows: CsvRow[],
  defaultProjectKey: string,
  target?: ImportTarget,
): NormalizedAssetRow[] {
  return rows.map((row, rowIndex) => {
    let projectKey = projectKeyFromRow(row, defaultProjectKey)
    if (target?.mode === 'new_project' || target?.mode === 'project') {
      projectKey = defaultProjectKey
    }
    const providerSlug = normalizeProviderSlug(row.provider ?? '')
    const matchKey = assetMatchKey({
      projectKey,
      providerSlug,
      assetType: row.asset_type || 'other',
      assetName: row.asset_name || '',
      externalId: row.external_id,
    })
    return {
      rowIndex,
      row,
      projectKey,
      matchKey,
      assetKey: assetKeyFromRow(row, projectKey),
    }
  })
}

export function findIntraBatchDuplicates(rows: NormalizedAssetRow[]): string[] {
  const seen = new Map<string, number>()
  const dupes: string[] = []
  for (const r of rows) {
    if (seen.has(r.matchKey)) dupes.push(r.matchKey)
    else seen.set(r.matchKey, r.rowIndex)
  }
  return [...new Set(dupes)]
}

export function buildMergeDiff(
  row: CsvRow,
  existing: ExistingAssetMatch,
): Record<string, { from: string | null; to: string }> {
  const diff: Record<string, { from: string | null; to: string }> = {}
  const notes = row.notes?.trim()
  if (notes) {
    if (isEmpty(existing.description) || MERGE_OVERWRITE.has('description')) {
      if ((existing.description ?? '') !== notes) {
        diff.notes = { from: existing.description, to: notes }
      }
    }
  }
  const admin = row.admin_url?.trim()
  if (admin && (isEmpty(existing.adminUrl) || MERGE_OVERWRITE.has('adminUrl'))) {
    if ((existing.adminUrl ?? '') !== admin) diff.adminUrl = { from: existing.adminUrl, to: admin }
  }
  const pub = row.public_url?.trim()
  if (pub && (isEmpty(existing.publicUrl) || MERGE_OVERWRITE.has('publicUrl'))) {
    if ((existing.publicUrl ?? '') !== pub) diff.publicUrl = { from: existing.publicUrl, to: pub }
  }
  const ver = row.verification_status?.trim()
  if (ver && (isEmpty(existing.verificationStatus) || MERGE_OVERWRITE.has('verificationStatus'))) {
    if (existing.verificationStatus !== ver) {
      diff.verificationStatus = { from: existing.verificationStatus, to: ver }
    }
  }
  return diff
}

export function detectDuplicates(
  rows: NormalizedAssetRow[],
  existing: Array<
    ExistingAssetMatch & {
      type: string
      providerSlug: string | null
    }
  >,
): ImportPreviewDuplicate[] {
  const byExt = new Map<string, (typeof existing)[0]>()
  const byComp = new Map<string, (typeof existing)[0]>()
  for (const a of existing) {
    if (a.externalIdentifier) byExt.set(`ext:${a.externalIdentifier.trim()}`, a)
    const key = `comp:${a.projectSlug}|${a.providerSlug ?? ''}|${a.type.toLowerCase()}|${a.name.toLowerCase()}`
    byComp.set(key, a)
  }

  const out: ImportPreviewDuplicate[] = []
  for (const r of rows) {
    let hit = r.row.external_id?.trim() ? byExt.get(`ext:${r.row.external_id.trim()}`) : undefined
    if (!hit) hit = byComp.get(r.matchKey)
    if (!hit) continue
    const mergeDiff = buildMergeDiff(r.row, hit)
    out.push({
      id: `${r.rowIndex}:${r.matchKey}`,
      rowIndex: r.rowIndex,
      matchKey: r.matchKey,
      existingAssetId: hit.id,
      existingName: hit.name,
      mergeDiff: Object.keys(mergeDiff).length ? mergeDiff : undefined,
    })
  }
  return out
}
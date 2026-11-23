import { and, eq } from 'drizzle-orm'
import type { ImportTarget } from '../../../shared/import/contract'
import { importPreviewBodySchema, legacyCsvImportSchema } from '../../../shared/schemas/import'
import { importBatches, projects, providers } from '../../../db/schema'
import {
  parseBundleFiles,
  parseBundleFromCsvOnly,
  parseZipBase64,
} from '../../utils/import-bundle'
import { detectDuplicates, findIntraBatchDuplicates, normalizeAssetRows } from '../../utils/import-duplicates'
import { projectKeyFromRow } from '../../utils/import-keys'
import { buildProviderCatalogIndex } from '../../utils/import-providers'
import { validateAssetRows } from '../../utils/import-validate'
import { scanCsvHeaders, rowHasSuspiciousSecret } from '../../utils/secret-scan'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'
import { loadExistingAssetsForImport } from '../../utils/import-existing-assets'
import { slugify } from '../../utils/slug'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)

  const modern = importPreviewBodySchema.safeParse(body)
  const legacy = legacyCsvImportSchema.safeParse(body)
  if (!modern.success && !legacy.success) {
    const issues = modern.success ? [] : modern.error.issues.map((i) => i.message)
    throw createError({
      statusCode: 400,
      statusMessage: issues[0] ?? 'Invalid input — check target project and file',
    })
  }

  const csv = modern.success ? modern.data.csv : legacy.data.csv
  const zipBase64 = modern.success ? modern.data.zipBase64 : undefined
  const columnMap = modern.success ? modern.data.columnMap : undefined
  const target: ImportTarget =
    modern.success && modern.data.target ? modern.data.target : { mode: 'workspace' }

  const files = zipBase64 ? await parseZipBase64(zipBase64) : csv ? parseBundleFromCsvOnly(csv) : null
  if (!files) throw createError({ statusCode: 400, statusMessage: 'Provide csv or zipBase64' })

  const bundle = parseBundleFiles(files, columnMap)
  const headerScan = scanCsvHeaders(bundle.assets.headers)
  if (!headerScan.ok) {
    throw createError({ statusCode: 400, statusMessage: `Forbidden columns: ${headerScan.rejected.join(', ')}` })
  }
  for (const row of bundle.assets.rows) {
    if (rowHasSuspiciousSecret(row)) {
      throw createError({ statusCode: 400, statusMessage: 'CSV contains suspicious secret values' })
    }
  }

  const db = useDb()
  let defaultProjectKey = 'imported'

  if (target.mode === 'project') {
    const [p] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, target.projectId), eq(projects.workspaceId, session.workspaceId)))
      .limit(1)
    if (!p) throw createError({ statusCode: 400, statusMessage: 'Project not found' })
    defaultProjectKey = p.slug
  } else if (target.mode === 'new_project') {
    defaultProjectKey = slugify(target.newProjectName)
  }

  const normalized = normalizeAssetRows(bundle.assets.rows, defaultProjectKey, target)
  const providerRows = await db.select().from(providers)
  const providerIndex = buildProviderCatalogIndex(providerRows)

  const { errors, warnings } = validateAssetRows(normalized, providerIndex)
  const intraBatchDuplicates = findIntraBatchDuplicates(normalized)

  const existingForDupes = await loadExistingAssetsForImport(db, session.workspaceId)

  const duplicates = detectDuplicates(normalized, existingForDupes)
  const previewOk = errors.length === 0 && intraBatchDuplicates.length === 0 && headerScan.ok

  const [batch] = await db
    .insert(importBatches)
    .values({
      workspaceId: session.workspaceId,
      status: 'preview',
      rowCount: bundle.assets.rows.length,
      previewJson: {
        bundle,
        target,
        duplicates: duplicates.map((d) => ({
          id: d.id,
          existingAssetId: d.existingAssetId,
          rowIndex: d.rowIndex,
          matchKey: d.matchKey,
        })),
      },
    })
    .returning()

  return {
    previewId: batch.id,
    ok: previewOk,
    summary: {
      assetRows: bundle.assets.rows.length,
      extraFiles: Object.keys(bundle.extras).length,
      duplicates: duplicates.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    errors,
    warnings,
    duplicates,
    intraBatchDuplicates,
    expectedHeaders: bundle.assets.headers,
    previewRows: bundle.assets.rows.slice(0, 50).map((row, rowIndex) => ({
      rowIndex,
      project: row.project || row.project_slug || projectKeyFromRow(row, defaultProjectKey),
      asset_name: row.asset_name,
      provider: row.provider,
      asset_type: row.asset_type,
    })),
    headerRejected: headerScan.rejected,
  }
})
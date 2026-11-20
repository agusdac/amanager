import { and, eq } from 'drizzle-orm'
import { csvImportSchema } from '../../../shared/schemas/inventory'
import {
  assets,
  importBatches,
  projectAssets,
  projectEnvironments,
  projects,
  providers,
} from '../../../db/schema'
import { parseCsv } from '../../utils/csv'
import { findOrCreateEmail, linkAssetLoginEmail } from '../../utils/inventory-links'
import { scanCsvHeaders, rowHasSuspiciousSecret } from '../../utils/secret-scan'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'
import { slugify } from '../../utils/slug'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = csvImportSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const { headers, rows } = parseCsv(parsed.data.csv)
  const headerScan = scanCsvHeaders(headers)
  if (!headerScan.ok) {
    throw createError({ statusCode: 400, statusMessage: `Forbidden columns: ${headerScan.rejected.join(', ')}` })
  }

  for (const row of rows) {
    if (rowHasSuspiciousSecret(row)) {
      throw createError({ statusCode: 400, statusMessage: 'CSV contains suspicious secret values' })
    }
  }

  const db = useDb()
  const providerRows = await db.select().from(providers)
  const bySlug = new Map(providerRows.map((p) => [p.slug, p.id]))

  const [batch] = await db
    .insert(importBatches)
    .values({
      workspaceId: session.workspaceId,
      rowCount: rows.length,
      status: 'committed',
    })
    .returning()

  let created = 0
  for (const row of rows) {
    const projectName = row.project || row.asset_name || 'Imported'
    let [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, session.workspaceId), eq(projects.slug, slugify(projectName))))
      .limit(1)

    if (!project) {
      ;[project] = await db
        .insert(projects)
        .values({
          workspaceId: session.workspaceId,
          slug: slugify(projectName),
          name: projectName,
        })
        .returning()
    }

    const providerSlug = (row.provider ?? '').toLowerCase().replace(/\s+/g, '-')
    const [asset] = await db
      .insert(assets)
      .values({
        workspaceId: session.workspaceId,
        name: row.asset_name || 'Unnamed asset',
        type: row.asset_type || 'other',
        providerId: bySlug.get(providerSlug) ?? null,
        adminUrl: row.admin_url || null,
        description: row.notes || null,
        source: 'import',
        importBatchId: batch.id,
        verificationStatus: 'declared',
      })
      .returning()

    let environmentId: string | null = null
    const envName = (row.environment ?? '').trim().toLowerCase()
    if (envName) {
      const [env] = await db
        .select()
        .from(projectEnvironments)
        .where(
          and(
            eq(projectEnvironments.workspaceId, session.workspaceId),
            eq(projectEnvironments.projectId, project.id),
            eq(projectEnvironments.name, envName),
          ),
        )
        .limit(1)
      environmentId = env?.id ?? null
    }

    await db.insert(projectAssets).values({
      workspaceId: session.workspaceId,
      projectId: project.id,
      assetId: asset.id,
      environmentId,
    })

    const loginEmail = (row.login_email ?? '').trim()
    if (loginEmail && loginEmail.includes('@')) {
      const email = await findOrCreateEmail(db, session.workspaceId, loginEmail)
      await linkAssetLoginEmail(db, session.workspaceId, asset.id, email.id)
    }

    created++
  }

  await recordAudit(db, { workspaceId: session.workspaceId, userId: session.id }, {
    entityType: 'import_batch',
    entityId: batch.id,
    action: 'import.commit',
    safeDiff: { rowCount: created, status: batch.status },
  })

  return { batchId: batch.id, created }
})
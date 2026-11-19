import { and, eq, inArray } from 'drizzle-orm'
import { assetEmails, assets, emailAddresses, projectAssets, projectEnvironments, projects, providers } from '../../../db/schema'
import { toCsv } from '../../utils/csv'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const format = (getQuery(event).format as string) ?? 'csv'

  const db = useDb()
  const rows = await db
    .select({
      asset: assets,
      projectName: projects.name,
      providerSlug: providers.slug,
      environmentName: projectEnvironments.name,
    })
    .from(assets)
    .leftJoin(projectAssets, eq(assets.id, projectAssets.assetId))
    .leftJoin(projects, eq(projectAssets.projectId, projects.id))
    .leftJoin(projectEnvironments, eq(projectEnvironments.id, projectAssets.environmentId))
    .leftJoin(providers, eq(assets.providerId, providers.id))
    .where(eq(assets.workspaceId, session.workspaceId))

  const assetIds = [...new Set(rows.map((r) => r.asset.id))]
  const loginByAsset = new Map<string, string>()
  if (assetIds.length) {
    const loginRows = await db
      .select({
        assetId: assetEmails.assetId,
        address: emailAddresses.address,
      })
      .from(assetEmails)
      .innerJoin(emailAddresses, eq(emailAddresses.id, assetEmails.emailId))
      .where(
        and(
          eq(assetEmails.workspaceId, session.workspaceId),
          eq(assetEmails.purpose, 'login'),
          inArray(assetEmails.assetId, assetIds),
        ),
      )
    for (const row of loginRows) {
      if (!loginByAsset.has(row.assetId)) loginByAsset.set(row.assetId, row.address)
    }
  }

  const mapped = rows.map((r) => ({
    project: r.projectName ?? '',
    provider: r.providerSlug ?? '',
    asset_type: r.asset.type,
    asset_name: r.asset.name,
    login_email: loginByAsset.get(r.asset.id) ?? '',
    environment: r.environmentName ?? '',
    admin_url: r.asset.adminUrl ?? '',
    notes: r.asset.description ?? '',
    verification_status: r.asset.verificationStatus,
  }))

  if (format === 'json') {
    return { assets: mapped }
  }

  const headers = [
    'project',
    'provider',
    'asset_type',
    'asset_name',
    'login_email',
    'environment',
    'admin_url',
    'notes',
    'verification_status',
  ]
  const csv = toCsv(headers, mapped)
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setHeader(event, 'content-disposition', 'attachment; filename="assets-export.csv"')
  return csv
})
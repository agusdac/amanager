import { and, eq, inArray, sql } from 'drizzle-orm'
import {
  assetDependencies,
  assetEmails,
  assets,
  configEntries,
  emailAddresses,
  projectAssets,
  projectEnvironments,
  projects,
  providers,
  vaultReferences,
} from '../../../db/schema'
import { IMPORT_FORMAT_VERSION } from '../../../shared/import/contract'
import { assetIdsForProject } from '../../utils/projectScope'
import { buildInventoryZip, emptyTemplateFiles } from '../../utils/import-bundle'
import { toCsv } from '../../utils/csv'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const projectId = typeof getQuery(event).projectId === 'string' ? getQuery(event).projectId : undefined

  let scopedAssetIds: string[] | undefined
  if (projectId) {
    scopedAssetIds = await assetIdsForProject(db, session.workspaceId, projectId)
    if (!scopedAssetIds.length) {
      const tpl = emptyTemplateFiles()
      tpl['manifest.json'] = JSON.stringify({ formatVersion: IMPORT_FORMAT_VERSION, projectId }, null, 2)
      return buildInventoryZip(tpl)
    }
  }

  const assetFilters = [eq(assets.workspaceId, session.workspaceId)]
  if (scopedAssetIds) assetFilters.push(inArray(assets.id, scopedAssetIds))

  const assetRows = await db
    .select({
      asset: assets,
      projectName: projects.name,
      projectSlug: projects.slug,
      providerSlug: providers.slug,
      environmentName: projectEnvironments.name,
    })
    .from(assets)
    .leftJoin(projectAssets, eq(assets.id, projectAssets.assetId))
    .leftJoin(projects, eq(projectAssets.projectId, projects.id))
    .leftJoin(projectEnvironments, eq(projectEnvironments.id, projectAssets.environmentId))
    .leftJoin(providers, eq(assets.providerId, providers.id))
    .where(and(...assetFilters))

  const assetIds = [...new Set(assetRows.map((r) => r.asset.id))]
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

  const assetCsvRows = assetRows.map((r) => ({
    project: r.projectName ?? '',
    project_slug: r.projectSlug ?? '',
    provider: r.providerSlug ?? '',
    asset_type: r.asset.type,
    asset_name: r.asset.name,
    asset_key: '',
    external_id: r.asset.externalIdentifier ?? '',
    login_email: loginByAsset.get(r.asset.id) ?? '',
    environment: r.environmentName ?? '',
    admin_url: r.asset.adminUrl ?? '',
    public_url: r.asset.publicUrl ?? '',
    notes: r.asset.description ?? '',
    verification_status: r.asset.verificationStatus,
  }))

  const assetHeaders = [
    'project',
    'project_slug',
    'provider',
    'asset_type',
    'asset_name',
    'asset_key',
    'external_id',
    'login_email',
    'environment',
    'admin_url',
    'public_url',
    'notes',
    'verification_status',
  ]

  let depRows: Record<string, string>[] = []
  if (assetIds.length) {
    const deps = await db
      .select()
      .from(assetDependencies)
      .where(
        and(
          eq(assetDependencies.workspaceId, session.workspaceId),
          inArray(assetDependencies.fromAssetId, assetIds),
        ),
      )
    const nameById = new Map(assetRows.map((r) => [r.asset.id, r.asset.name]))
    depRows = deps.map((d) => ({
      from_asset_key: nameById.get(d.fromAssetId) ?? d.fromAssetId,
      to_asset_key: nameById.get(d.toAssetId) ?? d.toAssetId,
      relation_type: d.relationType,
      description: d.description ?? '',
    }))
  }

  const configList =
    assetIds.length > 0
      ? await db
          .select()
          .from(configEntries)
          .where(and(eq(configEntries.workspaceId, session.workspaceId), inArray(configEntries.assetId, assetIds)))
      : []

  const vaultList =
    assetIds.length > 0
      ? await db
          .select()
          .from(vaultReferences)
          .where(and(eq(vaultReferences.workspaceId, session.workspaceId), inArray(vaultReferences.assetId, assetIds)))
      : []

  const files: Record<string, string> = {
    'manifest.json': JSON.stringify({ formatVersion: IMPORT_FORMAT_VERSION, projectId: projectId ?? null }, null, 2),
    'assets.csv': toCsv(assetHeaders, assetCsvRows),
    'dependencies.csv': toCsv(['from_asset_key', 'to_asset_key', 'relation_type', 'description'], depRows),
    'config_entries.csv': toCsv(
      ['asset_key', 'key', 'description', 'public_value'],
      configList.map((c) => ({
        asset_key: c.assetId ?? '',
        key: c.key,
        description: c.description ?? '',
        public_value: c.publicValue ?? '',
      })),
    ),
    'vault_references.csv': toCsv(
      ['asset_key', 'label', 'location_hint', 'item_url', 'notes'],
      vaultList.map((v) => ({
        asset_key: v.assetId ?? '',
        label: v.label,
        location_hint: v.locationHint,
        item_url: v.itemUrl ?? '',
        notes: v.notes ?? '',
      })),
    ),
  }

  const zip = await buildInventoryZip(files)
  setHeader(event, 'content-type', 'application/zip')
  setHeader(event, 'content-disposition', 'attachment; filename="hilko-inventory-export.zip"')
  return zip
})
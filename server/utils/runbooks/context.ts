import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  assetDependencies,
  assetRoles,
  assets,
  configEntries,
  emailAddresses,
  identities,
  projectAssets,
  projectEnvironments,
  projects,
  providers,
  vaultReferences,
} from '../../../db/schema'
import type * as schema from '../../../db/schema'

export type RunbookGenContext = {
  locale?: 'en' | 'es'
  project: { id: string; name: string; slug: string }
  environment: { id: string; name: string; kind: string } | null
  assets: Array<{
    id: string
    name: string
    type: string
    adminUrl: string | null
    publicUrl: string | null
    verificationStatus: string
    providerSlug: string | null
    environmentId: string | null
  }>
  vaultRefs: Array<{ id: string; label: string; locationHint: string; itemUrl: string | null }>
  configEntries: Array<{ id: string; key: string; publicValue: string | null; isSensitiveReference: boolean }>
  identities: Array<{ id: string; label: string; verificationStatus: string }>
  roles: Array<{ assetId: string; assetName: string; identityLabel: string | null; roleType: string }>
  emails: Array<{ id: string; address: string; label: string | null }>
  dependencies: Array<{
    fromAssetId: string
    fromName: string
    toAssetId: string
    toName: string
    relationType: string
    description: string | null
  }>
}

export async function loadRunbookContext(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  projectId: string,
  environmentId?: string | null,
): Promise<RunbookGenContext> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
    .limit(1)
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  let environment: RunbookGenContext['environment'] = null
  if (environmentId) {
    const [env] = await db
      .select()
      .from(projectEnvironments)
      .where(
        and(
          eq(projectEnvironments.id, environmentId),
          eq(projectEnvironments.workspaceId, workspaceId),
          eq(projectEnvironments.projectId, projectId),
        ),
      )
      .limit(1)
    if (env) environment = { id: env.id, name: env.name, kind: env.kind }
  }

  const linked = await db
    .select({
      asset: assets,
      environmentId: projectAssets.environmentId,
      providerSlug: providers.slug,
    })
    .from(projectAssets)
    .innerJoin(assets, eq(assets.id, projectAssets.assetId))
    .leftJoin(providers, eq(providers.id, assets.providerId))
    .where(and(eq(projectAssets.projectId, projectId), eq(projectAssets.workspaceId, workspaceId)))

  const assetList = linked.map((r) => ({
    id: r.asset.id,
    name: r.asset.name,
    type: r.asset.type,
    adminUrl: r.asset.adminUrl,
    publicUrl: r.asset.publicUrl,
    verificationStatus: r.asset.verificationStatus,
    providerSlug: r.providerSlug,
    environmentId: r.environmentId,
  }))

  const assetIds = assetList.map((a) => a.id)

  const vaultRefs = await db
    .select()
    .from(vaultReferences)
    .where(and(eq(vaultReferences.workspaceId, workspaceId), eq(vaultReferences.projectId, projectId)))

  const configRows = await db
    .select()
    .from(configEntries)
    .where(and(eq(configEntries.workspaceId, workspaceId), eq(configEntries.projectId, projectId)))

  const identityRows = await db
    .select()
    .from(identities)
    .where(eq(identities.workspaceId, workspaceId))

  const emailRows = await db
    .select()
    .from(emailAddresses)
    .where(eq(emailAddresses.workspaceId, workspaceId))

  const roles =
    assetIds.length > 0
      ? await db
          .select({
            assetId: assetRoles.assetId,
            assetName: assets.name,
            identityLabel: identities.label,
            roleType: assetRoles.roleType,
          })
          .from(assetRoles)
          .innerJoin(assets, eq(assets.id, assetRoles.assetId))
          .leftJoin(identities, eq(identities.id, assetRoles.identityId))
          .where(and(eq(assetRoles.workspaceId, workspaceId)))
      : []

  const filteredRoles = roles.filter((r) => assetIds.includes(r.assetId))

  const depRows =
    assetIds.length > 0
      ? await db
          .select({
            fromAssetId: assetDependencies.fromAssetId,
            toAssetId: assetDependencies.toAssetId,
            relationType: assetDependencies.relationType,
            description: assetDependencies.description,
            fromName: assets.name,
          })
          .from(assetDependencies)
          .innerJoin(assets, eq(assets.id, assetDependencies.fromAssetId))
          .where(and(eq(assetDependencies.workspaceId, workspaceId)))
      : []

  const assetNameById = new Map(assetList.map((a) => [a.id, a.name]))
  const dependencies = depRows
    .filter((d) => assetIds.includes(d.fromAssetId) && assetIds.includes(d.toAssetId))
    .map((d) => ({
      fromAssetId: d.fromAssetId,
      fromName: d.fromName,
      toAssetId: d.toAssetId,
      toName: assetNameById.get(d.toAssetId) ?? 'Asset',
      relationType: d.relationType,
      description: d.description,
    }))

  return {
    project: { id: project.id, name: project.name, slug: project.slug },
    environment,
    assets: assetList,
    vaultRefs: vaultRefs.map((v) => ({
      id: v.id,
      label: v.label,
      locationHint: v.locationHint,
      itemUrl: v.itemUrl,
    })),
    configEntries: configRows.map((c) => ({
      id: c.id,
      key: c.key,
      publicValue: c.publicValue,
      isSensitiveReference: c.isSensitiveReference,
    })),
    identities: identityRows.map((i) => ({
      id: i.id,
      label: i.label,
      verificationStatus: i.verificationStatus,
    })),
    roles: filteredRoles,
    emails: emailRows.map((e) => ({ id: e.id, address: e.address, label: e.label })),
    dependencies,
  }
}
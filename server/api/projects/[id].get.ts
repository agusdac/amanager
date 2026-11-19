import { and, eq, inArray } from 'drizzle-orm'
import {
  assetDependencies,
  assetEmails,
  assetRoles,
  assets,
  emailAddresses,
  identities,
  projectAssets,
  projectEnvironments,
  projects,
  providers,
} from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const db = useDb()
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  assertSameWorkspace(session.workspaceId, project.workspaceId)

  const environments = await db
    .select()
    .from(projectEnvironments)
    .where(and(eq(projectEnvironments.projectId, id), eq(projectEnvironments.workspaceId, session.workspaceId)))

  const linkedAssets = await db
    .select({
      asset: assets,
      environmentId: projectAssets.environmentId,
      providerName: providers.name,
      providerSlug: providers.slug,
    })
    .from(projectAssets)
    .innerJoin(assets, eq(assets.id, projectAssets.assetId))
    .leftJoin(providers, eq(providers.id, assets.providerId))
    .where(and(eq(projectAssets.projectId, id), eq(projectAssets.workspaceId, session.workspaceId)))

  const assetIds = linkedAssets.map((r) => r.asset.id)
  const envById = new Map(environments.map((e) => [e.id, e.name]))

  const roles =
    assetIds.length > 0
      ? await db
          .select({
            assetId: assetRoles.assetId,
            roleType: assetRoles.roleType,
            identityLabel: identities.label,
          })
          .from(assetRoles)
          .leftJoin(identities, eq(identities.id, assetRoles.identityId))
          .where(
            and(eq(assetRoles.workspaceId, session.workspaceId), inArray(assetRoles.assetId, assetIds)),
          )
      : []

  const assetEmailRows =
    assetIds.length > 0
      ? await db
          .select({
            assetId: assetEmails.assetId,
            purpose: assetEmails.purpose,
            address: emailAddresses.address,
          })
          .from(assetEmails)
          .innerJoin(emailAddresses, eq(emailAddresses.id, assetEmails.emailId))
          .where(
            and(eq(assetEmails.workspaceId, session.workspaceId), inArray(assetEmails.assetId, assetIds)),
          )
      : []

  const rolesByAsset = new Map<string, typeof roles>()
  for (const role of roles) {
    const list = rolesByAsset.get(role.assetId) ?? []
    list.push(role)
    rolesByAsset.set(role.assetId, list)
  }

  const emailsByAsset = new Map<string, typeof assetEmailRows>()
  for (const row of assetEmailRows) {
    const list = emailsByAsset.get(row.assetId) ?? []
    list.push(row)
    emailsByAsset.set(row.assetId, list)
  }

  const allDeps = await db
    .select()
    .from(assetDependencies)
    .where(eq(assetDependencies.workspaceId, session.workspaceId))

  const dependencies = allDeps.filter(
    (d) => assetIds.includes(d.fromAssetId) || assetIds.includes(d.toAssetId),
  )

  const assetViews = linkedAssets.map((row) => ({
    ...row.asset,
    providerName: row.providerName,
    providerSlug: row.providerSlug,
    environmentName: row.environmentId ? (envById.get(row.environmentId) ?? null) : null,
    roles: rolesByAsset.get(row.asset.id) ?? [],
    emails: emailsByAsset.get(row.asset.id) ?? [],
  }))

  return {
    project,
    environments,
    assets: assetViews,
    dependencies,
  }
})
import { and, eq } from 'drizzle-orm'
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
  providerAccounts,
  providers,
  configEntries,
  vaultReferences,
  verifications,
} from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1)
  if (!asset) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, asset.workspaceId)

  const [provider] = asset.providerId
    ? await db.select().from(providers).where(eq(providers.id, asset.providerId)).limit(1)
    : [null]
  const [account] = asset.providerAccountId
  ? await db
      .select()
      .from(providerAccounts)
      .where(
        and(eq(providerAccounts.id, asset.providerAccountId), eq(providerAccounts.workspaceId, session.workspaceId)),
      )
      .limit(1)
    : [null]

  const projectLinks = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      environmentId: projectAssets.environmentId,
      environmentName: projectEnvironments.name,
      environmentKind: projectEnvironments.kind,
    })
    .from(projectAssets)
    .innerJoin(projects, eq(projects.id, projectAssets.projectId))
    .leftJoin(projectEnvironments, eq(projectEnvironments.id, projectAssets.environmentId))
    .where(and(eq(projectAssets.assetId, id), eq(projectAssets.workspaceId, session.workspaceId)))

  const roles = await db
    .select({
      id: assetRoles.id,
      roleType: assetRoles.roleType,
      providerRoleLabel: assetRoles.providerRoleLabel,
      verificationStatus: assetRoles.verificationStatus,
      identityId: identities.id,
      identityLabel: identities.label,
    })
    .from(assetRoles)
    .leftJoin(identities, eq(identities.id, assetRoles.identityId))
    .where(and(eq(assetRoles.assetId, id), eq(assetRoles.workspaceId, session.workspaceId)))

  const emails = await db
    .select({
      id: assetEmails.id,
      purpose: assetEmails.purpose,
      address: emailAddresses.address,
      emailId: emailAddresses.id,
    })
    .from(assetEmails)
    .innerJoin(emailAddresses, eq(emailAddresses.id, assetEmails.emailId))
    .where(and(eq(assetEmails.assetId, id), eq(assetEmails.workspaceId, session.workspaceId)))

  const outboundDeps = await db
    .select({
      id: assetDependencies.id,
      relationType: assetDependencies.relationType,
      verificationStatus: assetDependencies.verificationStatus,
      description: assetDependencies.description,
      peerId: assets.id,
      peerName: assets.name,
      peerType: assets.type,
    })
    .from(assetDependencies)
    .innerJoin(assets, eq(assets.id, assetDependencies.toAssetId))
    .where(
      and(
        eq(assetDependencies.workspaceId, session.workspaceId),
        eq(assetDependencies.fromAssetId, id),
      ),
    )

  const inboundDeps = await db
    .select({
      id: assetDependencies.id,
      relationType: assetDependencies.relationType,
      verificationStatus: assetDependencies.verificationStatus,
      description: assetDependencies.description,
      peerId: assets.id,
      peerName: assets.name,
      peerType: assets.type,
    })
    .from(assetDependencies)
    .innerJoin(assets, eq(assets.id, assetDependencies.fromAssetId))
    .where(
      and(
        eq(assetDependencies.workspaceId, session.workspaceId),
        eq(assetDependencies.toAssetId, id),
      ),
    )

  const vaultRefs = await db
    .select()
    .from(vaultReferences)
    .where(
      and(eq(vaultReferences.workspaceId, session.workspaceId), eq(vaultReferences.assetId, id)),
    )

  const configRows = await db
    .select()
    .from(configEntries)
    .where(and(eq(configEntries.workspaceId, session.workspaceId), eq(configEntries.assetId, id)))

  const verificationRows = await db
    .select()
    .from(verifications)
    .where(
      and(
        eq(verifications.workspaceId, session.workspaceId),
        eq(verifications.sourceType, 'asset'),
        eq(verifications.sourceId, id),
      ),
    )

  return {
    asset,
    provider,
    providerAccount: account,
    projects: projectLinks,
    roles,
    emails,
    dependencies: {
      outbound: outboundDeps,
      inbound: inboundDeps,
    },
    vaultReferences: vaultRefs,
    configEntries: configRows,
    verifications: verificationRows,
  }
})
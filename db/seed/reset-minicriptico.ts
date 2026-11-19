import { and, eq, ilike, inArray, or } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  assetDependencies,
  assetEmails,
  assetRoles,
  assets,
  configEntries,
  emailAddresses,
  identities,
  identityEmails,
  projectAssets,
  projects,
  providerAccounts,
  vaultReferences,
  verifications,
} from '../schema'
import type * as schema from '../schema'

/** Removes Mini Críptico demo rows so the seed can run again from a clean slate. */
export async function resetMiniCripticoSeed(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  projectId: string,
) {
  const links = await db
    .select({ assetId: projectAssets.assetId })
    .from(projectAssets)
    .where(and(eq(projectAssets.workspaceId, workspaceId), eq(projectAssets.projectId, projectId)))

  const assetIds = links.map((l) => l.assetId)

  if (assetIds.length > 0) {
    await db
      .delete(verifications)
      .where(
        and(
          eq(verifications.workspaceId, workspaceId),
          eq(verifications.sourceType, 'asset'),
          inArray(verifications.sourceId, assetIds),
        ),
      )

    await db
      .delete(assetDependencies)
      .where(
        and(
          eq(assetDependencies.workspaceId, workspaceId),
          or(
            inArray(assetDependencies.fromAssetId, assetIds),
            inArray(assetDependencies.toAssetId, assetIds),
          )!,
        ),
      )

    await db
      .delete(configEntries)
      .where(
        and(
          eq(configEntries.workspaceId, workspaceId),
          or(
            inArray(configEntries.assetId, assetIds),
            eq(configEntries.projectId, projectId),
          )!,
        ),
      )

    await db
      .delete(vaultReferences)
      .where(
        and(
          eq(vaultReferences.workspaceId, workspaceId),
          or(
            inArray(vaultReferences.assetId, assetIds),
            eq(vaultReferences.projectId, projectId),
          )!,
        ),
      )

    await db
      .delete(assetEmails)
      .where(and(eq(assetEmails.workspaceId, workspaceId), inArray(assetEmails.assetId, assetIds)))

    await db
      .delete(assetRoles)
      .where(and(eq(assetRoles.workspaceId, workspaceId), inArray(assetRoles.assetId, assetIds)))

    await db
      .delete(projectAssets)
      .where(and(eq(projectAssets.workspaceId, workspaceId), eq(projectAssets.projectId, projectId)))

    await db
      .delete(assets)
      .where(and(eq(assets.workspaceId, workspaceId), inArray(assets.id, assetIds)))
  } else {
    await db
      .delete(configEntries)
      .where(and(eq(configEntries.workspaceId, workspaceId), eq(configEntries.projectId, projectId)))
    await db
      .delete(vaultReferences)
      .where(and(eq(vaultReferences.workspaceId, workspaceId), eq(vaultReferences.projectId, projectId)))
  }

  const seedIdentities = await db
    .select({ id: identities.id })
    .from(identities)
    .where(
      and(
        eq(identities.workspaceId, workspaceId),
        inArray(identities.label, ['Google A', 'Google B']),
      ),
    )
  const identityIds = seedIdentities.map((i) => i.id)
  if (identityIds.length > 0) {
    await db
      .delete(identityEmails)
      .where(and(eq(identityEmails.workspaceId, workspaceId), inArray(identityEmails.identityId, identityIds)))
    await db
      .delete(identities)
      .where(and(eq(identities.workspaceId, workspaceId), inArray(identities.id, identityIds)))
  }

  const seedAccounts = await db
    .select({ id: providerAccounts.id })
    .from(providerAccounts)
    .where(
      and(
        eq(providerAccounts.workspaceId, workspaceId),
        inArray(providerAccounts.label, ['Google Account A', 'Google Account B']),
      ),
    )
  const accountIds = seedAccounts.map((a) => a.id)
  if (accountIds.length > 0) {
    await db
      .delete(providerAccounts)
      .where(and(eq(providerAccounts.workspaceId, workspaceId), inArray(providerAccounts.id, accountIds)))
  }

  await db
    .delete(emailAddresses)
    .where(and(eq(emailAddresses.workspaceId, workspaceId), ilike(emailAddresses.address, '%@example.invalid')))
}
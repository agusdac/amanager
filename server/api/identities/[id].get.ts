import { and, eq } from 'drizzle-orm'
import {
  assetRoles,
  assets,
  emailAddresses,
  identities,
  identityEmails,
  providerAccountIdentities,
  providerAccounts,
  providers,
} from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [identity] = await db.select().from(identities).where(eq(identities.id, id)).limit(1)
  if (!identity) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, identity.workspaceId)

  const [provider] = identity.providerId
    ? await db.select().from(providers).where(eq(providers.id, identity.providerId)).limit(1)
    : [null]

  const assetAccess = await db
    .select({
      roleId: assetRoles.id,
      roleType: assetRoles.roleType,
      providerRoleLabel: assetRoles.providerRoleLabel,
      verificationStatus: assetRoles.verificationStatus,
      assetId: assets.id,
      assetName: assets.name,
      assetType: assets.type,
      providerSlug: providers.slug,
    })
    .from(assetRoles)
    .innerJoin(assets, eq(assets.id, assetRoles.assetId))
    .leftJoin(providers, eq(providers.id, assets.providerId))
    .where(and(eq(assetRoles.identityId, id), eq(assetRoles.workspaceId, session.workspaceId)))

  const emails = await db
    .select({
      purpose: identityEmails.purpose,
      address: emailAddresses.address,
      emailId: emailAddresses.id,
    })
    .from(identityEmails)
    .innerJoin(emailAddresses, eq(emailAddresses.id, identityEmails.emailId))
    .where(and(eq(identityEmails.identityId, id), eq(identityEmails.workspaceId, session.workspaceId)))

  const linkedAccounts = await db
    .select({
      accountId: providerAccounts.id,
      label: providerAccounts.label,
      providerName: providers.name,
    })
    .from(providerAccountIdentities)
    .innerJoin(providerAccounts, eq(providerAccounts.id, providerAccountIdentities.accountId))
    .leftJoin(providers, eq(providers.id, providerAccounts.providerId))
    .where(
      and(eq(providerAccountIdentities.identityId, id), eq(providerAccountIdentities.workspaceId, session.workspaceId)),
    )

  return {
    identity,
    provider,
    assetAccess,
    emails,
    linkedAccounts,
  }
})
import { and, eq } from 'drizzle-orm'
import { createAssetFullSchema } from '../../../shared/schemas/inventory'
import {
  assetRoles,
  assets,
  identities,
  projectAssets,
  projectEnvironments,
  projects,
  providerAccounts,
  providers,
} from '../../../db/schema'
import { useDb } from '../../utils/db'
import { findOrCreateEmail, linkAssetLoginEmail } from '../../utils/inventory-links'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createAssetFullSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const db = useDb()
  const data = parsed.data

  if (data.projectId) {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, data.projectId), eq(projects.workspaceId, session.workspaceId)))
      .limit(1)
    if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  let providerId = data.providerId ?? null
  if (!providerId && data.providerSlug) {
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.slug, data.providerSlug))
      .limit(1)
    providerId = provider?.id ?? null
  }

  if (data.providerAccountId) {
    const [account] = await db
      .select()
      .from(providerAccounts)
      .where(
        and(eq(providerAccounts.id, data.providerAccountId), eq(providerAccounts.workspaceId, session.workspaceId)),
      )
      .limit(1)
    if (!account) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  if (data.identityId) {
    const [identity] = await db
      .select()
      .from(identities)
      .where(and(eq(identities.id, data.identityId), eq(identities.workspaceId, session.workspaceId)))
      .limit(1)
    if (!identity) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  if (data.environmentId && data.projectId) {
    const [env] = await db
      .select()
      .from(projectEnvironments)
      .where(
        and(
          eq(projectEnvironments.id, data.environmentId),
          eq(projectEnvironments.projectId, data.projectId),
          eq(projectEnvironments.workspaceId, session.workspaceId),
        ),
      )
      .limit(1)
    if (!env) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const [asset] = await db
    .insert(assets)
    .values({
      workspaceId: session.workspaceId,
      name: data.name,
      type: data.type,
      providerId,
      providerAccountId: data.providerAccountId ?? null,
      criticality: data.criticality ?? 'medium',
      adminUrl: data.adminUrl || null,
      publicUrl: data.publicUrl || null,
      description: data.description ?? null,
      externalIdentifier: data.externalIdentifier ?? null,
      verificationStatus: data.verificationStatus ?? 'declared',
    })
    .returning()

  if (data.projectId) {
    await db.insert(projectAssets).values({
      workspaceId: session.workspaceId,
      projectId: data.projectId,
      assetId: asset.id,
      environmentId: data.environmentId ?? null,
    })
  }

  if (data.identityId) {
    await db.insert(assetRoles).values({
      workspaceId: session.workspaceId,
      assetId: asset.id,
      identityId: data.identityId,
      roleType: data.accessRoleType ?? 'admin',
    })
  }

  const loginEmail = data.loginEmail?.trim()
  if (loginEmail) {
    const email = await findOrCreateEmail(db, session.workspaceId, loginEmail)
    await linkAssetLoginEmail(db, session.workspaceId, asset.id, email.id, data.identityId)
  }

  return { asset }
})
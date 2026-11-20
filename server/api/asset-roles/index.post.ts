import { and, eq } from 'drizzle-orm'
import { createAssetRoleSchema } from '../../../shared/schemas/inventory'
import { assetRoles, assets, identities } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createAssetRoleSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [assetRow] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, parsed.data.assetId), eq(assets.workspaceId, session.workspaceId)))
    .limit(1)
  if (!assetRow) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const [identityRow] = await db
    .select()
    .from(identities)
    .where(and(eq(identities.id, parsed.data.identityId), eq(identities.workspaceId, session.workspaceId)))
    .limit(1)
  if (!identityRow) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const [role] = await db
    .insert(assetRoles)
    .values({
      workspaceId: session.workspaceId,
      assetId: parsed.data.assetId,
      identityId: parsed.data.identityId,
      roleType: parsed.data.roleType,
      providerRoleLabel: parsed.data.providerRoleLabel ?? null,
    })
    .returning()

  await recordAudit(db, { workspaceId: session.workspaceId, userId: session.id }, {
    entityType: 'asset_role',
    entityId: role.id,
    action: 'asset_role.create',
    safeDiff: {
      assetId: role.assetId,
      identityId: role.identityId,
      roleType: role.roleType,
    },
  })

  return { role }
})
import { and, eq } from 'drizzle-orm'
import { assets, identities } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { computeAssetImpact, computeIdentityImpact } from '../../utils/impact'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const entityType = getQuery(event).entityType as string
  const entityId = getQuery(event).entityId as string

  if (!entityType || !entityId) {
    throw createError({ statusCode: 400, statusMessage: 'entityType and entityId required' })
  }

  const db = useDb()

  if (entityType === 'asset') {
    const [asset] = await db.select().from(assets).where(eq(assets.id, entityId)).limit(1)
    if (!asset) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    assertSameWorkspace(session.workspaceId, asset.workspaceId)
    const edges = await computeAssetImpact(db, session.workspaceId, entityId)
    return { entityType, entityId, edges }
  }

  if (entityType === 'identity') {
    const [identity] = await db.select().from(identities).where(eq(identities.id, entityId)).limit(1)
    if (!identity) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    assertSameWorkspace(session.workspaceId, identity.workspaceId)
    const { assets: linkedAssets, edges } = await computeIdentityImpact(db, session.workspaceId, entityId)
    return { entityType, entityId, linkedAssets, edges }
  }

  throw createError({ statusCode: 400, statusMessage: 'entityType must be asset or identity' })
})
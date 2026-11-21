import { and, eq } from 'drizzle-orm'
import { actions, assets } from '../../../../db/schema'
import { useDb } from '../../../utils/db'
import { sortActions } from '../../../utils/actions'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const assetId = getRouterParam(event, 'id')
  if (!assetId) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  const db = useDb()
  const [asset] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.workspaceId, session.workspaceId)))
    .limit(1)
  if (!asset) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const rows = await db
    .select()
    .from(actions)
    .where(and(eq(actions.workspaceId, session.workspaceId), eq(actions.assetId, assetId)))

  return { actions: sortActions(rows) }
})
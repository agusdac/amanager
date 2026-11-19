import { eq } from 'drizzle-orm'
import { assets } from '../../../db/schema'
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
  const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1)
  if (!asset) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  assertSameWorkspace(session.workspaceId, asset.workspaceId)

  return { asset }
})
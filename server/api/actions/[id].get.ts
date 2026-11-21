import { and, eq } from 'drizzle-orm'
import { actions } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  const db = useDb()
  const [row] = await db
    .select()
    .from(actions)
    .where(and(eq(actions.id, id), eq(actions.workspaceId, session.workspaceId)))
    .limit(1)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  return { action: row }
})
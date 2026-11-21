import { and, eq } from 'drizzle-orm'
import { workspaceFavorites } from '../../../../db/schema'
import { useDb } from '../../../utils/db'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  const db = useDb()
  const [row] = await db
    .delete(workspaceFavorites)
    .where(
      and(
        eq(workspaceFavorites.id, id),
        eq(workspaceFavorites.workspaceId, session.workspaceId),
        eq(workspaceFavorites.userId, session.id),
      ),
    )
    .returning({ id: workspaceFavorites.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  return { ok: true }
})
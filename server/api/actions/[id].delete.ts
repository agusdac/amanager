import { and, eq } from 'drizzle-orm'
import { actions } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  const db = useDb()
  const [row] = await db
    .delete(actions)
    .where(and(eq(actions.id, id), eq(actions.workspaceId, session.workspaceId)))
    .returning({ id: actions.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  return { ok: true }
})
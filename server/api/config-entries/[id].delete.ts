import { and, eq } from 'drizzle-orm'
import { configEntries } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const result = await db
    .delete(configEntries)
    .where(and(eq(configEntries.id, id), eq(configEntries.workspaceId, session.workspaceId)))
    .returning()

  if (!result.length) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  return { ok: true }
})
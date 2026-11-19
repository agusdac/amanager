import { and, eq } from 'drizzle-orm'
import { assetDependencies } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const result = await db
    .delete(assetDependencies)
    .where(and(eq(assetDependencies.id, id), eq(assetDependencies.workspaceId, session.workspaceId)))
    .returning()

  if (!result.length) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  return { ok: true }
})
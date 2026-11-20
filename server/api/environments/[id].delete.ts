import { and, eq } from 'drizzle-orm'
import { projectAssets, projectEnvironments } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [env] = await db
    .select()
    .from(projectEnvironments)
    .where(and(eq(projectEnvironments.id, id), eq(projectEnvironments.workspaceId, session.workspaceId)))
    .limit(1)

  if (!env) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  await db
    .update(projectAssets)
    .set({ environmentId: null })
    .where(
      and(eq(projectAssets.workspaceId, session.workspaceId), eq(projectAssets.environmentId, id)),
    )

  const result = await db
    .delete(projectEnvironments)
    .where(and(eq(projectEnvironments.id, id), eq(projectEnvironments.workspaceId, session.workspaceId)))
    .returning()

  if (!result.length) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  return { ok: true }
})
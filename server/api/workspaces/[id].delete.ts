import { and, eq } from 'drizzle-orm'
import { workspaces } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'
import { requireOwner } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireOwner(session)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [existing] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, existing.id)
  if (existing.type !== 'team') {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete personal workspace' })
  }

  await recordAudit(db, session, {
    entityType: 'workspace',
    entityId: id,
    action: 'workspace.delete',
    safeDiff: { name: existing.name },
  })

  await db.delete(workspaces).where(and(eq(workspaces.id, id), eq(workspaces.type, 'team')))

  return { ok: true }
})
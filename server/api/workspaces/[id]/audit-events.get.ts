import { and, desc, eq, lt, ne } from 'drizzle-orm'
import { auditEvents, users, workspaces } from '../../../../db/schema'
import { useDb } from '../../../utils/db'
import { requireSession } from '../../../utils/session'
import { assertSameWorkspace } from '../../../utils/workspace'
import { requireAdmin } from '../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireAdmin(session)
  const workspaceId = getRouterParam(event, 'id')
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  if (!ws) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, workspaceId)

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit ?? 50) || 50, 50)
  const before = typeof query.before === 'string' ? new Date(query.before) : null

  const conditions = [
    eq(auditEvents.workspaceId, workspaceId),
    ne(auditEvents.action, 'session.workspace_switch'),
  ]
  if (before && !Number.isNaN(before.getTime())) {
    conditions.push(lt(auditEvents.createdAt, before))
  }

  const rows = await db
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      entityType: auditEvents.entityType,
      entityId: auditEvents.entityId,
      safeDiffJson: auditEvents.safeDiffJson,
      createdAt: auditEvents.createdAt,
      actorName: users.name,
      actorId: users.id,
    })
    .from(auditEvents)
    .leftJoin(users, eq(users.id, auditEvents.actorUserId))
    .where(and(...conditions))
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit)

  return { events: rows }
})
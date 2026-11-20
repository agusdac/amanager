import { and, eq, isNull } from 'drizzle-orm'
import { workspaceInvites, workspaces } from '../../../../../db/schema'
import { useDb } from '../../../../utils/db'
import { requireSession } from '../../../../utils/session'
import { assertSameWorkspace } from '../../../../utils/workspace'
import { requireAdmin } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireAdmin(session)
  const workspaceId = getRouterParam(event, 'id')
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  if (!ws) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, workspaceId)

  const now = new Date()
  const invites = await db
    .select({
      id: workspaceInvites.id,
      email: workspaceInvites.email,
      role: workspaceInvites.role,
      expiresAt: workspaceInvites.expiresAt,
      createdAt: workspaceInvites.createdAt,
      acceptedAt: workspaceInvites.acceptedAt,
      revokedAt: workspaceInvites.revokedAt,
    })
    .from(workspaceInvites)
    .where(
      and(
        eq(workspaceInvites.workspaceId, workspaceId),
        isNull(workspaceInvites.acceptedAt),
        isNull(workspaceInvites.revokedAt),
      ),
    )

  return {
    invites: invites.map((i) => ({
      ...i,
      expired: i.expiresAt < now,
    })),
  }
})
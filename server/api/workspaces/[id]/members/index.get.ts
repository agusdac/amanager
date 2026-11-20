import { and, eq } from 'drizzle-orm'
import { users, workspaceMembers, workspaces } from '../../../../../db/schema'
import { useDb } from '../../../../utils/db'
import { requireSession } from '../../../../utils/session'
import { assertSameWorkspace } from '../../../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const workspaceId = getRouterParam(event, 'id')
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  if (!ws) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, workspaceId)

  const members = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))

  return { members }
})
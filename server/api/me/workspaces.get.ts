import { eq } from 'drizzle-orm'
import { workspaces, workspaceMembers } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()

  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      type: workspaces.type,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, session.id))

  return {
    workspaces: rows,
    activeWorkspaceId: session.workspaceId,
  }
})
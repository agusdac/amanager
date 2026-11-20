import { and, asc, eq } from 'drizzle-orm'
import { projects, workspaces, workspaceMembers } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()

  const [personal] = await db
    .select({ workspaceId: workspaces.id })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(workspaceMembers.userId, session.id), eq(workspaces.type, 'personal')))
    .limit(1)

  if (!personal) {
    return { workspaceId: null as string | null, projects: [] as { id: string; name: string; websiteUrl: string | null }[] }
  }

  const list = await db
    .select({
      id: projects.id,
      name: projects.name,
      websiteUrl: projects.websiteUrl,
    })
    .from(projects)
    .where(eq(projects.workspaceId, personal.workspaceId))
    .orderBy(asc(projects.createdAt))

  return { workspaceId: personal.workspaceId, projects: list }
})
import { and, eq } from 'drizzle-orm'
import { projectEnvironments } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const projectId = getQuery(event).projectId as string | undefined
  const db = useDb()

  const rows = await db
    .select()
    .from(projectEnvironments)
    .where(
      projectId
        ? and(eq(projectEnvironments.workspaceId, session.workspaceId), eq(projectEnvironments.projectId, projectId))
        : eq(projectEnvironments.workspaceId, session.workspaceId),
    )

  return { environments: rows }
})
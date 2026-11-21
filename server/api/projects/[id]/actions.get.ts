import { and, eq } from 'drizzle-orm'
import { actions, projects } from '../../../../db/schema'
import { useDb } from '../../../utils/db'
import { sortActions } from '../../../utils/actions'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const projectId = getRouterParam(event, 'id')
  if (!projectId) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  const db = useDb()
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, session.workspaceId)))
    .limit(1)
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const rows = await db
    .select()
    .from(actions)
    .where(
      and(
        eq(actions.workspaceId, session.workspaceId),
        eq(actions.projectId, projectId),
      ),
    )

  return { actions: sortActions(rows) }
})
import { and, asc, eq } from 'drizzle-orm'
import { runbookExecutions } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { getRunbookOrThrow } from '../../utils/runbooks/access'
import { listVisibleRunbookSteps } from '../../utils/runbooks/queries'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const runbook = await getRunbookOrThrow(db, session.workspaceId, id)
  const steps = await listVisibleRunbookSteps(db, session.workspaceId, id)

  const executions = await db
    .select()
    .from(runbookExecutions)
    .where(and(eq(runbookExecutions.runbookId, id), eq(runbookExecutions.workspaceId, session.workspaceId)))
    .orderBy(asc(runbookExecutions.startedAt))

  return { runbook, steps, executions }
})
import { and, desc, eq, inArray } from 'drizzle-orm'
import { projects, runbookExecutions, runbooks } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const query = getQuery(event)
  const projectId = typeof query.projectId === 'string' ? query.projectId : undefined
  const templateSlug = typeof query.templateSlug === 'string' ? query.templateSlug : undefined
  const status = typeof query.status === 'string' ? query.status : undefined

  const db = useDb()
  const conditions = [eq(runbooks.workspaceId, session.workspaceId)]
  if (projectId) conditions.push(eq(runbooks.projectId, projectId))
  if (templateSlug) conditions.push(eq(runbooks.templateSlug, templateSlug))
  if (status) conditions.push(eq(runbooks.status, status))

  const rows = await db
    .select({
      runbook: runbooks,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(runbooks)
    .innerJoin(projects, eq(projects.id, runbooks.projectId))
    .where(and(...conditions))
    .orderBy(desc(runbooks.updatedAt))

  const runbookIds = rows.map((r) => r.runbook.id)
  const executions =
    runbookIds.length > 0
      ? await db
          .select()
          .from(runbookExecutions)
          .where(
            and(
              eq(runbookExecutions.workspaceId, session.workspaceId),
              inArray(runbookExecutions.runbookId, runbookIds),
            ),
          )
          .orderBy(desc(runbookExecutions.startedAt))
      : []

  const activeByRunbook = new Map<string, (typeof executions)[number]>()
  const latestByRunbook = new Map<string, (typeof executions)[number]>()
  for (const ex of executions) {
    if (!latestByRunbook.has(ex.runbookId)) latestByRunbook.set(ex.runbookId, ex)
    if (ex.status === 'in_progress' && !activeByRunbook.has(ex.runbookId)) {
      activeByRunbook.set(ex.runbookId, ex)
    }
  }

  return {
    runbooks: rows.map((r) => ({
      ...r.runbook,
      projectName: r.projectName,
      projectSlug: r.projectSlug,
      activeExecution: activeByRunbook.get(r.runbook.id) ?? null,
      latestExecution: latestByRunbook.get(r.runbook.id) ?? null,
    })),
  }
})
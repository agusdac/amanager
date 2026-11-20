import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { projects, runbookExecutions, runbooks } from '../../../db/schema'
import type * as schema from '../../../db/schema'
import { assertSameWorkspace } from '../workspace'

export async function getRunbookOrThrow(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  runbookId: string,
) {
  const [row] = await db.select().from(runbooks).where(eq(runbooks.id, runbookId)).limit(1)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(workspaceId, row.workspaceId)
  return row
}

export async function getExecutionOrThrow(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  executionId: string,
) {
  const [row] = await db.select().from(runbookExecutions).where(eq(runbookExecutions.id, executionId)).limit(1)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(workspaceId, row.workspaceId)
  return row
}

export async function assertRunbookProject(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  projectId: string,
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
    .limit(1)
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  return project
}
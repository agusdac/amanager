import { and, asc, eq } from 'drizzle-orm'
import {
  runbookExecutionSteps,
  runbookExecutions,
  runbookStepResults,
  runbookSteps,
  runbooks,
} from '../../../db/schema'
import { useDb } from '../../utils/db'
import { getExecutionOrThrow } from '../../utils/runbooks/access'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const execution = await getExecutionOrThrow(db, session.workspaceId, id)

  const [runbook] = await db.select().from(runbooks).where(eq(runbooks.id, execution.runbookId)).limit(1)

  const results = await db
    .select()
    .from(runbookStepResults)
    .where(and(eq(runbookStepResults.executionId, id), eq(runbookStepResults.workspaceId, session.workspaceId)))

  if (execution.contentBinding === 'snapshot') {
    const snapshotSteps = await db
      .select()
      .from(runbookExecutionSteps)
      .where(
        and(eq(runbookExecutionSteps.executionId, id), eq(runbookExecutionSteps.workspaceId, session.workspaceId)),
      )
      .orderBy(asc(runbookExecutionSteps.position))

    const steps = snapshotSteps.map((s) => {
      const result = results.find((r) => r.executionStepId === s.id)
      return { ...s, result: result ?? null, binding: 'snapshot' as const }
    })
    return { execution, runbook, steps }
  }

  const liveSteps = await db
    .select()
    .from(runbookSteps)
    .where(and(eq(runbookSteps.runbookId, execution.runbookId), eq(runbookSteps.workspaceId, session.workspaceId)))
    .orderBy(asc(runbookSteps.position))

  const steps = liveSteps.map((s) => {
    const result = results.find((r) => r.runbookStepId === s.id)
    const orphaned = s.hiddenAt != null
    return {
      id: s.id,
      stepKey: s.stepKey,
      position: s.position,
      kind: s.kind,
      title: s.title,
      bodyMarkdown: s.bodyMarkdown,
      risk: s.risk,
      dependsOnJson: s.dependsOnJson,
      updatedAt: s.updatedAt,
      result: result ?? null,
      binding: 'live' as const,
      orphaned,
      updatedSinceStart: s.updatedAt > execution.startedAt,
    }
  })

  return { execution, runbook, steps }
})
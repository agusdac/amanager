import { and, eq } from 'drizzle-orm'
import { runbookStepResults } from '../../../../../db/schema'
import { patchStepResultSchema } from '../../../../../shared/schemas/runbooks'
import { useDb } from '../../../../utils/db'
import { getExecutionOrThrow } from '../../../../utils/runbooks/access'
import { requireSession } from '../../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const executionId = getRouterParam(event, 'id')
  const stepRef = getRouterParam(event, 'stepRef')
  if (!executionId || !stepRef) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = patchStepResultSchema.parse(await readBody(event))
  const db = useDb()
  const execution = await getExecutionOrThrow(db, session.workspaceId, executionId)
  if (execution.status !== 'in_progress') {
    throw createError({ statusCode: 400, statusMessage: 'Execution closed' })
  }

  const scope =
    execution.contentBinding === 'snapshot'
      ? eq(runbookStepResults.executionStepId, stepRef)
      : eq(runbookStepResults.runbookStepId, stepRef)

  const [existing] = await db
    .select()
    .from(runbookStepResults)
    .where(
      and(
        eq(runbookStepResults.executionId, executionId),
        eq(runbookStepResults.workspaceId, session.workspaceId),
        scope,
      ),
    )
    .limit(1)

  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Step result not found' })

  const doneStatuses = ['done', 'skipped', 'failed']
  const [result] = await db
    .update(runbookStepResults)
    .set({
      status: body.status,
      resultNote: body.resultNote ?? existing.resultNote,
      completedAt: doneStatuses.includes(body.status) ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(runbookStepResults.id, existing.id))
    .returning()

  return { result }
})
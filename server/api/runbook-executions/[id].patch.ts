import { eq } from 'drizzle-orm'
import { runbookExecutions } from '../../../db/schema'
import { patchExecutionSchema } from '../../../shared/schemas/runbooks'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { getExecutionOrThrow } from '../../utils/runbooks/access'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = patchExecutionSchema.parse(await readBody(event))
  const db = useDb()
  const existing = await getExecutionOrThrow(db, session.workspaceId, id)

  if (existing.status !== 'in_progress') {
    throw createError({ statusCode: 400, statusMessage: 'Execution already closed' })
  }

  const [execution] = await db
    .update(runbookExecutions)
    .set({
      status: body.status,
      completedAt: new Date(),
    })
    .where(eq(runbookExecutions.id, id))
    .returning()

  await recordAudit(db, session, {
    entityType: 'runbook_execution',
    entityId: id,
    action: body.status === 'completed' ? 'complete' : 'cancel',
    safeDiff: { status: body.status },
  })

  return { execution }
})
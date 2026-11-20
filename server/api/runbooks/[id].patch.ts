import { count, eq } from 'drizzle-orm'
import { runbookSteps, runbooks } from '../../../db/schema'
import { patchRunbookSchema } from '../../../shared/schemas/runbooks'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { getRunbookOrThrow } from '../../utils/runbooks/access'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = patchRunbookSchema.parse(await readBody(event))
  const db = useDb()
  await getRunbookOrThrow(db, session.workspaceId, id)

  const [updated] = await db
    .update(runbooks)
    .set({
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.overviewMarkdown !== undefined ? { overviewMarkdown: body.overviewMarkdown } : {}),
      updatedAt: new Date(),
    })
    .where(eq(runbooks.id, id))
    .returning()

  const [{ stepCount }] = await db
    .select({ stepCount: count() })
    .from(runbookSteps)
    .where(eq(runbookSteps.runbookId, id))

  await recordAudit(db, session, {
    entityType: 'runbook',
    entityId: id,
    action: 'update',
    safeDiff: { fields: Object.keys(body), stepCount },
  })

  return { runbook: updated }
})
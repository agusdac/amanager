import { and, eq } from 'drizzle-orm'
import { runbookSteps } from '../../../../../db/schema'
import { createRunbookStepSchema } from '../../../../../shared/schemas/runbooks'
import { recordAudit } from '../../../../utils/audit'
import { useDb } from '../../../../utils/db'
import { getRunbookOrThrow } from '../../../../utils/runbooks/access'
import { requireSession } from '../../../../utils/session'
import { requireEditor } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const runbookId = getRouterParam(event, 'id')
  if (!runbookId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = createRunbookStepSchema.parse(await readBody(event))
  const db = useDb()
  await getRunbookOrThrow(db, session.workspaceId, runbookId)

  const existing = await db
    .select({ position: runbookSteps.position })
    .from(runbookSteps)
    .where(and(eq(runbookSteps.runbookId, runbookId), eq(runbookSteps.workspaceId, session.workspaceId)))

  const maxPos = existing.reduce((m, s) => Math.max(m, s.position), -1)
  const stepKey = `manual-${crypto.randomUUID().slice(0, 8)}`

  const [step] = await db
    .insert(runbookSteps)
    .values({
      workspaceId: session.workspaceId,
      runbookId,
      stepKey,
      position: maxPos + 1,
      kind: body.kind,
      title: body.title,
      bodyMarkdown: body.bodyMarkdown,
      risk: body.risk,
      dependsOnJson: body.dependsOn,
      source: 'manual',
      isRequired: true,
    })
    .returning()

  await recordAudit(db, session, {
    entityType: 'runbook',
    entityId: runbookId,
    action: 'update',
    safeDiff: { addedStep: stepKey },
  })

  return { step }
})
import { and, eq } from 'drizzle-orm'
import { runbookSteps } from '../../../../../db/schema'
import { patchRunbookStepSchema } from '../../../../../shared/schemas/runbooks'
import { recordAudit } from '../../../../utils/audit'
import { useDb } from '../../../../utils/db'
import { getRunbookOrThrow } from '../../../../utils/runbooks/access'
import { requireSession } from '../../../../utils/session'
import { assertWorkspaceMember } from '../../../../utils/workspace-membership'
import { requireEditor } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const runbookId = getRouterParam(event, 'id')
  const stepId = getRouterParam(event, 'stepId')
  if (!runbookId || !stepId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = patchRunbookStepSchema.parse(await readBody(event))
  const db = useDb()
  await getRunbookOrThrow(db, session.workspaceId, runbookId)

  if (body.defaultAssigneeUserId) {
    const member = await assertWorkspaceMember(db, body.defaultAssigneeUserId, session.workspaceId)
    if (!member) throw createError({ statusCode: 400, statusMessage: 'Assignee not in workspace' })
  }

  const [existing] = await db
    .select()
    .from(runbookSteps)
    .where(
      and(
        eq(runbookSteps.id, stepId),
        eq(runbookSteps.runbookId, runbookId),
        eq(runbookSteps.workspaceId, session.workspaceId),
      ),
    )
    .limit(1)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const [step] = await db
    .update(runbookSteps)
    .set({
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.bodyMarkdown !== undefined ? { bodyMarkdown: body.bodyMarkdown } : {}),
      ...(body.kind !== undefined ? { kind: body.kind } : {}),
      ...(body.risk !== undefined ? { risk: body.risk } : {}),
      ...(body.dependsOn !== undefined ? { dependsOnJson: body.dependsOn } : {}),
      ...(body.position !== undefined ? { position: body.position } : {}),
      ...(body.hidden === true ? { hiddenAt: new Date() } : {}),
      ...(body.hidden === false ? { hiddenAt: null } : {}),
      ...(body.defaultAssigneeUserId !== undefined
        ? { defaultAssigneeUserId: body.defaultAssigneeUserId }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(runbookSteps.id, stepId))
    .returning()

  await recordAudit(db, session, {
    entityType: 'runbook',
    entityId: runbookId,
    action: 'update',
    safeDiff: { stepId, fields: Object.keys(body) },
  })

  return { step }
})
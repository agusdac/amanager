import {
  runbookExecutionSteps,
  runbookExecutions,
  runbookStepResults,
} from '../../../../../db/schema'
import { startExecutionSchema } from '../../../../../shared/schemas/runbooks'
import { recordAudit } from '../../../../utils/audit'
import { useDb } from '../../../../utils/db'
import { getRunbookOrThrow } from '../../../../utils/runbooks/access'
import { listVisibleRunbookSteps } from '../../../../utils/runbooks/queries'
import { requireSession } from '../../../../utils/session'
import { requireEditor } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const runbookId = getRouterParam(event, 'id')
  if (!runbookId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = startExecutionSchema.parse((await readBody(event).catch(() => ({}))) ?? {})
  const db = useDb()
  const runbook = await getRunbookOrThrow(db, session.workspaceId, runbookId)

  const steps = await listVisibleRunbookSteps(db, session.workspaceId, runbookId)

  const [execution] = await db
    .insert(runbookExecutions)
    .values({
      workspaceId: session.workspaceId,
      runbookId,
      startedBy: session.id,
      status: 'in_progress',
      contentBinding: body.contentBinding,
    })
    .returning()

  if (body.contentBinding === 'snapshot') {
    const snapshotRows = await db
      .insert(runbookExecutionSteps)
      .values(
        steps.map((s) => ({
          workspaceId: session.workspaceId,
          executionId: execution.id,
          stepKey: s.stepKey,
          position: s.position,
          kind: s.kind,
          title: s.title,
          bodyMarkdown: s.bodyMarkdown,
          risk: s.risk,
          dependsOnJson: s.dependsOnJson,
          originStepId: s.id,
          assigneeUserId: s.defaultAssigneeUserId,
        })),
      )
      .returning()

    await db.insert(runbookStepResults).values(
      snapshotRows.map((s) => ({
        workspaceId: session.workspaceId,
        executionId: execution.id,
        executionStepId: s.id,
        runbookStepId: null,
        status: s.bodyMarkdown.includes('Pending in inventory') ? 'blocked' : 'todo',
      })),
    )
  } else {
    await db.insert(runbookStepResults).values(
      steps.map((s) => ({
        workspaceId: session.workspaceId,
        executionId: execution.id,
        executionStepId: null,
        runbookStepId: s.id,
        status: s.bodyMarkdown.includes('Pending in inventory') ? 'blocked' : 'todo',
      })),
    )
  }

  await recordAudit(db, session, {
    entityType: 'runbook_execution',
    entityId: execution.id,
    action: 'start',
    safeDiff: {
      runbookId,
      contentBinding: body.contentBinding,
      projectId: runbook.projectId,
    },
  })

  return { execution }
})
import { and, eq } from 'drizzle-orm'
import { runbookSteps } from '../../../../db/schema'
import { refreshInventorySchema } from '../../../../shared/schemas/runbooks'
import { recordAudit } from '../../../utils/audit'
import { useDb } from '../../../utils/db'
import { getRunbookOrThrow } from '../../../utils/runbooks/access'
import { loadRunbookContext } from '../../../utils/runbooks/context'
import { generateStepBody } from '../../../utils/runbooks/generator'
import { listAllRunbookSteps, templateStepsForRunbook } from '../../../utils/runbooks/queries'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = refreshInventorySchema.parse((await readBody(event).catch(() => ({}))) ?? {})
  const db = useDb()
  const runbook = await getRunbookOrThrow(db, session.workspaceId, id)

  const ctx = await loadRunbookContext(db, session.workspaceId, runbook.projectId, runbook.environmentId)

  const steps = await listAllRunbookSteps(db, session.workspaceId, id)
  const templateSteps = await templateStepsForRunbook(db, runbook)

  const accept = new Set(body.acceptStepKeys ?? [])
  const diff: Array<{ stepKey: string; title: string; before: string; after: string }> = []

  for (const step of steps) {
    if (step.source !== 'generated') continue
    const def = templateSteps.find((t) => t.key === step.stepKey)
    if (!def) continue
    const { body: after } = generateStepBody(def, ctx)
    if (after !== step.bodyMarkdown) {
      diff.push({ stepKey: step.stepKey, title: step.title, before: step.bodyMarkdown, after })
    }
  }

  if (body.acceptStepKeys?.length) {
    const toUpdate = diff.filter((d) => accept.has(d.stepKey))
    if (toUpdate.length > 0) {
      for (const item of toUpdate) {
        await db
          .update(runbookSteps)
          .set({ bodyMarkdown: item.after, updatedAt: new Date() })
          .where(
            and(
              eq(runbookSteps.runbookId, id),
              eq(runbookSteps.stepKey, item.stepKey),
              eq(runbookSteps.workspaceId, session.workspaceId),
            ),
          )
      }
      await recordAudit(db, session, {
        entityType: 'runbook',
        entityId: id,
        action: 'update',
        safeDiff: { refreshFromInventory: true, merged: toUpdate.length },
      })
    }
  }

  return { diff, merged: body.acceptStepKeys?.length ? diff.filter((d) => accept.has(d.stepKey)).length : 0 }
})
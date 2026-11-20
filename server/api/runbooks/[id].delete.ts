import { eq } from 'drizzle-orm'
import { runbooks } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { getRunbookOrThrow } from '../../utils/runbooks/access'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const existing = await getRunbookOrThrow(db, session.workspaceId, id)

  await db.delete(runbooks).where(eq(runbooks.id, id))

  await recordAudit(db, session, {
    entityType: 'runbook',
    entityId: id,
    action: 'delete',
    safeDiff: { title: existing.title, projectId: existing.projectId },
  })

  return { ok: true }
})
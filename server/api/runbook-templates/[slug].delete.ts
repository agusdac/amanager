import { and, eq } from 'drizzle-orm'
import { runbookTemplates, runbooks } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { assertWorkspaceTemplate } from '../../utils/runbooks/template-access'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const db = useDb()
  const existing = await assertWorkspaceTemplate(db, session.workspaceId, slug)

  await db
    .update(runbooks)
    .set({ templateId: null })
    .where(and(eq(runbooks.templateId, existing.id), eq(runbooks.workspaceId, session.workspaceId)))

  await db.delete(runbookTemplates).where(eq(runbookTemplates.id, existing.id))

  await recordAudit(db, session, {
    entityType: 'runbook_template',
    entityId: existing.id,
    action: 'delete',
    safeDiff: { slug: existing.slug, title: existing.title },
  })

  return { ok: true }
})
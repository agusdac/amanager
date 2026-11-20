import { eq } from 'drizzle-orm'
import { runbookTemplates } from '../../../db/schema'
import { upsertWorkspaceRunbookTemplateSchema } from '../../../shared/schemas/runbooks'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { assertWorkspaceTemplate } from '../../utils/runbooks/template-access'
import { buildWorkspaceTemplateSchemaJson, publicTemplateFromRow } from '../../utils/runbooks/templates'
import { uniqueWorkspaceTemplateSlug } from '../../utils/runbooks/workspace-template-slug'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const body = upsertWorkspaceRunbookTemplateSchema.parse(await readBody(event))
  const db = useDb()
  const existing = await assertWorkspaceTemplate(db, session.workspaceId, slug)

  const nextSlug =
    body.title !== existing.title
      ? await uniqueWorkspaceTemplateSlug(db, session.workspaceId, body.title, existing.id)
      : existing.slug

  const schemaJson = buildWorkspaceTemplateSchemaJson({
    requiresEnvironment: body.requiresEnvironment,
    steps: body.steps,
  })

  const [row] = await db
    .update(runbookTemplates)
    .set({
      title: body.title,
      slug: nextSlug,
      schemaJson,
      contentMarkdown: body.contentMarkdown ?? null,
      version: existing.version + 1,
    })
    .where(eq(runbookTemplates.id, existing.id))
    .returning()

  await recordAudit(db, session, {
    entityType: 'runbook_template',
    entityId: row.id,
    action: 'update',
    safeDiff: { slug: nextSlug, title: body.title, stepCount: body.steps.length },
  })

  return { template: publicTemplateFromRow(row) }
})
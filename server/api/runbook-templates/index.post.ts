import { runbookTemplates } from '../../../db/schema'
import { upsertWorkspaceRunbookTemplateSchema } from '../../../shared/schemas/runbooks'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { buildWorkspaceTemplateSchemaJson, publicTemplateFromRow } from '../../utils/runbooks/templates'
import { uniqueWorkspaceTemplateSlug } from '../../utils/runbooks/workspace-template-slug'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = upsertWorkspaceRunbookTemplateSchema.parse(await readBody(event))
  const db = useDb()

  const slug = await uniqueWorkspaceTemplateSlug(db, session.workspaceId, body.title)
  const schemaJson = buildWorkspaceTemplateSchemaJson({
    requiresEnvironment: body.requiresEnvironment,
    steps: body.steps,
  })

  const [row] = await db
    .insert(runbookTemplates)
    .values({
      workspaceId: session.workspaceId,
      slug,
      title: body.title,
      schemaJson,
      contentMarkdown: body.contentMarkdown ?? null,
    })
    .returning()

  await recordAudit(db, session, {
    entityType: 'runbook_template',
    entityId: row.id,
    action: 'create',
    safeDiff: { slug, title: body.title, stepCount: body.steps.length },
  })

  return { template: publicTemplateFromRow(row) }
})
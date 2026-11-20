import { asc } from 'drizzle-orm'
import { runbookTemplates } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { templateVisibleToWorkspace } from '../../utils/runbooks/template-access'
import { publicTemplateFromRow } from '../../utils/runbooks/templates'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const rows = await db
    .select()
    .from(runbookTemplates)
    .where(templateVisibleToWorkspace(session.workspaceId))
    .orderBy(asc(runbookTemplates.slug))
  return { templates: rows.map(publicTemplateFromRow) }
})
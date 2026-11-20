import { useDb } from '../../utils/db'
import { getTemplateBySlugForWorkspace } from '../../utils/runbooks/template-access'
import { publicTemplateFromRow } from '../../utils/runbooks/templates'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const db = useDb()
  const row = await getTemplateBySlugForWorkspace(db, session.workspaceId, slug)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  return { template: publicTemplateFromRow(row) }
})
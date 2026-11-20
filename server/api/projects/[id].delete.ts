import { and, eq } from 'drizzle-orm'
import { configEntries, projects, vaultReferences } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, project.workspaceId)

  await db
    .update(configEntries)
    .set({ projectId: null })
    .where(and(eq(configEntries.workspaceId, session.workspaceId), eq(configEntries.projectId, id)))

  await db
    .update(vaultReferences)
    .set({ projectId: null })
    .where(and(eq(vaultReferences.workspaceId, session.workspaceId), eq(vaultReferences.projectId, id)))

  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, session.workspaceId)))
    .returning()

  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  await recordAudit(db, { workspaceId: session.workspaceId, userId: session.id }, {
    entityType: 'project',
    entityId: deleted.id,
    action: 'project.delete',
    safeDiff: { name: deleted.name, slug: deleted.slug },
  })

  return { ok: true, deletedId: deleted.id }
})
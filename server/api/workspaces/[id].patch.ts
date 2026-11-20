import { and, eq } from 'drizzle-orm'
import { workspaces } from '../../../db/schema'
import { renameWorkspaceSchema } from '#shared/schemas/workspaces'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'
import { requireAdmin } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireAdmin(session)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = renameWorkspaceSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)

  const db = useDb()
  const [existing] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, existing.id)
  if (existing.type !== 'team') {
    throw createError({ statusCode: 400, statusMessage: 'Personal workspace cannot be renamed here' })
  }

  const [updated] = await db
    .update(workspaces)
    .set({ name: parsed.data.name.trim(), updatedAt: new Date() })
    .where(and(eq(workspaces.id, id), eq(workspaces.type, 'team')))
    .returning()

  await recordAudit(db, session, {
    entityType: 'workspace',
    entityId: id,
    action: 'workspace.rename',
    safeDiff: { name: updated.name },
  })

  return { workspace: updated }
})
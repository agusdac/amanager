import { and, eq } from 'drizzle-orm'
import { updateActionSchema } from '../../../shared/schemas/actions'
import { actions } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { assertActionAnchors, rejectActionSecrets } from '../../utils/actions'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  const body = await readBody(event)
  const parsed = updateActionSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [existing] = await db
    .select()
    .from(actions)
    .where(and(eq(actions.id, id), eq(actions.workspaceId, session.workspaceId)))
    .limit(1)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const merged = {
    assetId: parsed.data.assetId !== undefined ? parsed.data.assetId : existing.assetId,
    projectId: parsed.data.projectId !== undefined ? parsed.data.projectId : existing.projectId,
  }
  await assertActionAnchors(db, session.workspaceId, merged)

  const nextTitle = parsed.data.title ?? existing.title
  const nextBody = parsed.data.bodyMarkdown ?? existing.bodyMarkdown
  rejectActionSecrets({ title: nextTitle, body_markdown: nextBody })

  const [row] = await db
    .update(actions)
    .set({
      title: nextTitle,
      bodyMarkdown: nextBody,
      pinned: parsed.data.pinned ?? existing.pinned,
      kind: parsed.data.kind !== undefined ? parsed.data.kind : existing.kind,
      assetId: merged.assetId,
      projectId: merged.projectId,
      updatedAt: new Date(),
    })
    .where(eq(actions.id, id))
    .returning()

  return { action: row }
})
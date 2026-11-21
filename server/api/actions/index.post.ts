import { createActionSchema } from '../../../shared/schemas/actions'
import { DEFAULT_ACTION_KIND } from '../../../shared/actions/kindDefaults'
import { actions } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { assertActionAnchors, rejectActionSecrets } from '../../utils/actions'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = createActionSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  rejectActionSecrets({ title: parsed.data.title, body_markdown: parsed.data.bodyMarkdown })

  const db = useDb()
  await assertActionAnchors(db, session.workspaceId, parsed.data)

  const [row] = await db
    .insert(actions)
    .values({
      workspaceId: session.workspaceId,
      title: parsed.data.title,
      bodyMarkdown: parsed.data.bodyMarkdown,
      assetId: parsed.data.assetId ?? null,
      projectId: parsed.data.projectId ?? null,
      pinned: parsed.data.pinned ?? false,
      kind: parsed.data.kind ?? DEFAULT_ACTION_KIND,
      createdByUserId: session.id,
    })
    .returning()

  return { action: row }
})
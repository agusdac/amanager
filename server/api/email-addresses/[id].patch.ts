import { and, eq } from 'drizzle-orm'
import { patchEmailSchema } from '../../../shared/schemas/inventory'
import { emailAddresses } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = patchEmailSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const updates: Record<string, unknown> = {}
  if (parsed.data.passwordManagerItemUrl !== undefined) {
    updates.passwordManagerItemUrl =
      parsed.data.passwordManagerItemUrl === '' ? null : parsed.data.passwordManagerItemUrl
  }
  if (parsed.data.label !== undefined) updates.label = parsed.data.label

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No updates' })
  }

  const [row] = await db
    .update(emailAddresses)
    .set(updates)
    .where(and(eq(emailAddresses.id, id), eq(emailAddresses.workspaceId, session.workspaceId)))
    .returning()

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  return { email: row }
})
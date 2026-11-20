import { and, eq } from 'drizzle-orm'
import { assetEmails } from '../../../db/schema'
import { patchAssetEmailSchema } from '#shared/schemas/inventory'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = patchAssetEmailSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)

  const db = useDb()
  const updates: Record<string, string | null> = {}
  if (parsed.data.passwordManagerItemUrl !== undefined) {
    updates.passwordManagerItemUrl =
      parsed.data.passwordManagerItemUrl === '' ? null : parsed.data.passwordManagerItemUrl
  }
  if (!Object.keys(updates).length) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  }

  const [row] = await db
    .update(assetEmails)
    .set(updates)
    .where(and(eq(assetEmails.id, id), eq(assetEmails.workspaceId, session.workspaceId)))
    .returning()

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  return { assetEmail: row }
})
import { and, eq } from 'drizzle-orm'
import { reorderFavoritesSchema } from '../../../../shared/schemas/actions'
import { workspaceFavorites } from '../../../../db/schema'
import { useDb } from '../../../utils/db'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = reorderFavoritesSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  for (const item of parsed.data.items) {
    const [row] = await db
      .update(workspaceFavorites)
      .set({ position: item.position })
      .where(
        and(
          eq(workspaceFavorites.id, item.id),
          eq(workspaceFavorites.workspaceId, session.workspaceId),
          eq(workspaceFavorites.userId, session.id),
        ),
      )
      .returning({ id: workspaceFavorites.id })
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  return { ok: true }
})
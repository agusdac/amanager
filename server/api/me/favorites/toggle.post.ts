import { and, eq, max } from 'drizzle-orm'
import { createFavoriteSchema } from '../../../../shared/schemas/actions'
import { workspaceFavorites } from '../../../../db/schema'
import { useDb } from '../../../utils/db'
import { assertFavoriteTarget } from '../../../utils/favorites'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createFavoriteSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  await assertFavoriteTarget(db, session.workspaceId, parsed.data.targetType, parsed.data.targetId)

  const [existing] = await db
    .select()
    .from(workspaceFavorites)
    .where(
      and(
        eq(workspaceFavorites.workspaceId, session.workspaceId),
        eq(workspaceFavorites.userId, session.id),
        eq(workspaceFavorites.targetType, parsed.data.targetType),
        eq(workspaceFavorites.targetId, parsed.data.targetId),
      ),
    )
    .limit(1)

  if (existing) {
    await db.delete(workspaceFavorites).where(eq(workspaceFavorites.id, existing.id))
    return { favorited: false, favoriteId: null as string | null }
  }

  const [posRow] = await db
    .select({ maxPos: max(workspaceFavorites.position) })
    .from(workspaceFavorites)
    .where(
      and(
        eq(workspaceFavorites.workspaceId, session.workspaceId),
        eq(workspaceFavorites.userId, session.id),
      ),
    )
  const position = (posRow?.maxPos ?? -1) + 1

  const [row] = await db
    .insert(workspaceFavorites)
    .values({
      workspaceId: session.workspaceId,
      userId: session.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      position,
    })
    .returning()

  return { favorited: true, favoriteId: row.id }
})
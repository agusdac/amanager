import { useDb } from '../../utils/db'
import { resolveFavorites } from '../../utils/favorites'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const favorites = await resolveFavorites(db, session.workspaceId, session.id)
  return { favorites }
})
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { useDb } from '../utils/db'
import { requireSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      locale: users.locale,
      theme: users.theme,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  return {
    user: {
      ...row,
      workspaceId: session.workspaceId,
      workspaceRole: session.workspaceRole,
    },
  }
})
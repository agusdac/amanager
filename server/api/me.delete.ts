import { and, eq } from 'drizzle-orm'
import { users, workspaces } from '../../db/schema'
import { useDb } from '../utils/db'
import { destroySession, requireSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()

  await db.transaction(async (tx) => {
    await tx
      .delete(workspaces)
      .where(and(eq(workspaces.ownerUserId, session.id), eq(workspaces.type, 'personal')))
    await tx.delete(users).where(eq(users.id, session.id))
  })

  await destroySession(event)
  return { ok: true }
})
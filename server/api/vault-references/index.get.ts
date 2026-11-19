import { eq } from 'drizzle-orm'
import { vaultReferences } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const list = await db
    .select()
    .from(vaultReferences)
    .where(eq(vaultReferences.workspaceId, session.workspaceId))
  return { vaultReferences: list }
})
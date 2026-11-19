import { eq } from 'drizzle-orm'
import { emailAddresses } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const list = await db
    .select()
    .from(emailAddresses)
    .where(eq(emailAddresses.workspaceId, session.workspaceId))
  return { emails: list }
})
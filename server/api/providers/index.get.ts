import { eq } from 'drizzle-orm'
import { providers } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const db = useDb()
  const list = await db.select().from(providers).where(eq(providers.isSystem, true))
  return { providers: list }
})
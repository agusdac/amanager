import { asc, eq } from 'drizzle-orm'
import { projects } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, session.workspaceId))
    .orderBy(asc(projects.createdAt))
  return { projects: list }
})
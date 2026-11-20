import { eq } from 'drizzle-orm'
import { workspaceMembers, workspaces } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { findPersonalWorkspaceId } from '../../utils/workspace-membership'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()

  const existingId = await findPersonalWorkspaceId(db, session.id)
  if (existingId) {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, existingId)).limit(1)
    return { workspace: { id: existingId, name: ws?.name ?? 'Personal', type: 'personal' as const }, created: false }
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({
      type: 'personal',
      name: 'Personal',
      ownerUserId: session.id,
    })
    .returning()

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: session.id,
    role: 'owner',
  })

  return {
    workspace: { id: workspace.id, name: workspace.name, type: workspace.type },
    created: true,
  }
})
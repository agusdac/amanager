import { and, eq } from 'drizzle-orm'
import { workspaces } from '../../../../db/schema'
import { switchWorkspaceSchema } from '#shared/schemas/workspaces'
import { useDb } from '../../../utils/db'
import {
  requireSession,
  setActiveWorkspaceForSession,
} from '../../../utils/session'
import { assertWorkspaceMember } from '../../../utils/workspace-membership'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const paramId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = switchWorkspaceSchema.safeParse({ workspaceId: body?.workspaceId ?? paramId })
  if (!parsed.success) throw invalidInputError(parsed.error)

  const workspaceId = parsed.data.workspaceId
  const db = useDb()

  const member = await assertWorkspaceMember(db, session.id, workspaceId)
  if (!member) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  await setActiveWorkspaceForSession(event, session.id, workspaceId)

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)

  return {
    workspace: {
      id: workspaceId,
      name: ws?.name,
      type: ws?.type,
      role: member.role,
    },
  }
})
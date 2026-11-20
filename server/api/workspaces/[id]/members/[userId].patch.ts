import { and, eq } from 'drizzle-orm'
import { workspaceMembers, workspaces } from '../../../../../db/schema'
import { updateMemberRoleSchema } from '#shared/schemas/workspaces'
import { recordAudit } from '../../../../utils/audit'
import { useDb } from '../../../../utils/db'
import { requireSession } from '../../../../utils/session'
import { assertSameWorkspace } from '../../../../utils/workspace'
import { countOwners, isOnlyOwner } from '../../../../utils/workspace-offboarding'
import { isWorkspaceRole, requireAdmin, requireOwner } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireAdmin(session)

  const workspaceId = getRouterParam(event, 'id')
  const targetUserId = getRouterParam(event, 'userId')
  if (!workspaceId || !targetUserId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = updateMemberRoleSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)
  if (!isWorkspaceRole(parsed.data.role)) throw createError({ statusCode: 400, statusMessage: 'Invalid role' })

  const db = useDb()
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  if (!ws) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, workspaceId)

  if (parsed.data.role === 'owner') {
    requireOwner(session)
  }

  const [target] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)),
    )
    .limit(1)
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  if (target.role === 'owner' && parsed.data.role !== 'owner') {
    if ((await countOwners(db, workspaceId)) <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot demote the last owner',
      })
    }
  }

  const [updated] = await db
    .update(workspaceMembers)
    .set({ role: parsed.data.role })
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)),
    )
    .returning()

  await recordAudit(db, session, {
    entityType: 'workspace_member',
    entityId: targetUserId,
    action: 'member.role_change',
    safeDiff: { role: parsed.data.role },
  })

  return { member: updated }
})
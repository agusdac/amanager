import { and, eq, sql } from 'drizzle-orm'
import {
  runbookExecutionSteps,
  runbookSteps,
  verifications,
  workspaceMembers,
  workspaces,
} from '../../../../../db/schema'
import { recordAudit } from '../../../../utils/audit'
import { useDb } from '../../../../utils/db'
import { requireSession } from '../../../../utils/session'
import { assertSameWorkspace } from '../../../../utils/workspace'
import { isOnlyOwner } from '../../../../utils/workspace-offboarding'
import { requireAdmin } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const workspaceId = getRouterParam(event, 'id')
  const targetUserId = getRouterParam(event, 'userId')
  if (!workspaceId || !targetUserId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const isSelf = targetUserId === session.id
  if (!isSelf) requireAdmin(session)

  const db = useDb()
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  if (!ws) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, workspaceId)

  if (isSelf && (await isOnlyOwner(db, workspaceId, session.id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Promote another owner before leaving',
    })
  }

  const [{ verifCount }] = await db
    .select({ verifCount: sql<number>`count(*)::int` })
    .from(verifications)
    .where(
      and(
        eq(verifications.workspaceId, workspaceId),
        eq(verifications.assigneeUserId, targetUserId),
      ),
    )

  const [{ stepCount }] = await db
    .select({ stepCount: sql<number>`count(*)::int` })
    .from(runbookExecutionSteps)
    .where(
      and(
        eq(runbookExecutionSteps.workspaceId, workspaceId),
        eq(runbookExecutionSteps.assigneeUserId, targetUserId),
      ),
    )

  await db
    .update(verifications)
    .set({ assigneeUserId: null })
    .where(
      and(
        eq(verifications.workspaceId, workspaceId),
        eq(verifications.assigneeUserId, targetUserId),
      ),
    )

  await db
    .update(runbookSteps)
    .set({ defaultAssigneeUserId: null })
    .where(
      and(
        eq(runbookSteps.workspaceId, workspaceId),
        eq(runbookSteps.defaultAssigneeUserId, targetUserId),
      ),
    )

  await db
    .update(runbookExecutionSteps)
    .set({ assigneeUserId: null })
    .where(
      and(
        eq(runbookExecutionSteps.workspaceId, workspaceId),
        eq(runbookExecutionSteps.assigneeUserId, targetUserId),
      ),
    )

  await db
    .delete(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)),
    )

  await recordAudit(db, session, {
    entityType: 'workspace_member',
    entityId: targetUserId,
    action: isSelf ? 'member.leave' : 'member.remove',
    safeDiff: {
      assigneesCleared: { verifications: verifCount ?? 0, executionSteps: stepCount ?? 0 },
    },
  })

  return { ok: true }
})
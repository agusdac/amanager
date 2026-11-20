import { and, eq } from 'drizzle-orm'
import { workspaceInvites, workspaces } from '../../../../../db/schema'
import { recordAudit } from '../../../../utils/audit'
import { useDb } from '../../../../utils/db'
import { requireSession } from '../../../../utils/session'
import { assertSameWorkspace } from '../../../../utils/workspace'
import { requireAdmin } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireAdmin(session)
  const workspaceId = getRouterParam(event, 'id')
  const inviteId = getRouterParam(event, 'inviteId')
  if (!workspaceId || !inviteId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  if (!ws) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, workspaceId)

  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(and(eq(workspaceInvites.id, inviteId), eq(workspaceInvites.workspaceId, workspaceId)))
    .limit(1)
  if (!invite) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  await db
    .update(workspaceInvites)
    .set({ revokedAt: new Date() })
    .where(eq(workspaceInvites.id, inviteId))

  await recordAudit(db, session, {
    entityType: 'workspace_invite',
    entityId: inviteId,
    action: 'member.invite_revoke',
    safeDiff: { emailDomain: invite.email.split('@')[1] },
  })

  return { ok: true }
})
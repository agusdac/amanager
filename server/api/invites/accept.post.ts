import { and, eq } from 'drizzle-orm'
import { workspaceInvites, workspaceMembers } from '../../../db/schema'
import { acceptInviteSchema } from '#shared/schemas/workspaces'
import { hashToken } from '../../utils/crypto'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession, setActiveWorkspaceForSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = acceptInviteSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)

  const db = useDb()
  const tokenHash = hashToken(parsed.data.token)
  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.tokenHash, tokenHash))
    .limit(1)

  if (!invite) throw createError({ statusCode: 404, statusMessage: 'Invalid invite' })
  if (invite.revokedAt) throw createError({ statusCode: 410, statusMessage: 'Invite revoked' })
  if (invite.acceptedAt) throw createError({ statusCode: 410, statusMessage: 'Invite already used' })
  if (invite.expiresAt < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'Invite expired' })
  }

  if (session.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw createError({ statusCode: 403, statusMessage: 'Email does not match invite' })
  }

  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: invite.workspaceId,
      userId: session.id,
      role: invite.role,
    })
    .onConflictDoUpdate({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      set: { role: invite.role },
    })

  await db
    .update(workspaceInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(workspaceInvites.id, invite.id))

  await setActiveWorkspaceForSession(event, session.id, invite.workspaceId)

  await recordAudit(db, { workspaceId: invite.workspaceId, userId: session.id }, {
    entityType: 'workspace_member',
    entityId: session.id,
    action: 'member.join',
    safeDiff: { role: invite.role },
  })

  return { workspaceId: invite.workspaceId, role: invite.role }
})
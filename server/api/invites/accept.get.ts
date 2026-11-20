import { eq } from 'drizzle-orm'
import { workspaceInvites, workspaces } from '../../../db/schema'
import { hashToken } from '../../utils/crypto'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token
  if (!token || typeof token !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const db = useDb()
  const tokenHash = hashToken(token)
  const [invite] = await db
    .select({
      id: workspaceInvites.id,
      email: workspaceInvites.email,
      role: workspaceInvites.role,
      expiresAt: workspaceInvites.expiresAt,
      revokedAt: workspaceInvites.revokedAt,
      acceptedAt: workspaceInvites.acceptedAt,
      workspaceName: workspaces.name,
      workspaceId: workspaces.id,
    })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvites.workspaceId))
    .where(eq(workspaceInvites.tokenHash, tokenHash))
    .limit(1)

  if (!invite) throw createError({ statusCode: 404, statusMessage: 'Invalid invite' })
  if (invite.revokedAt) throw createError({ statusCode: 410, statusMessage: 'Invite revoked' })
  if (invite.acceptedAt) throw createError({ statusCode: 410, statusMessage: 'Invite already used' })
  if (invite.expiresAt < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'Invite expired' })
  }

  return {
    invite: {
      email: invite.email,
      role: invite.role,
      workspaceName: invite.workspaceName,
      workspaceId: invite.workspaceId,
    },
  }
})
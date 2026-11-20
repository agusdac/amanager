import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { workspaceInvites } from '../../db/schema'
import type * as schema from '../../db/schema'
import { hashToken } from './crypto'

export async function findValidInviteForEmail(
  db: NodePgDatabase<typeof schema>,
  token: string,
  email: string,
) {
  const tokenHash = hashToken(token)
  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.tokenHash, tokenHash))
    .limit(1)

  if (!invite) throw createError({ statusCode: 400, statusMessage: 'Invalid invite' })
  if (invite.revokedAt) throw createError({ statusCode: 410, statusMessage: 'Invite revoked' })
  if (invite.acceptedAt) throw createError({ statusCode: 410, statusMessage: 'Invite already used' })
  if (invite.expiresAt < new Date()) throw createError({ statusCode: 410, statusMessage: 'Invite expired' })
  if (invite.email.toLowerCase() !== email.toLowerCase()) {
    throw createError({ statusCode: 403, statusMessage: 'Email does not match invite' })
  }
  return invite
}
import { and, eq, isNull } from 'drizzle-orm'
import { workspaceInvites, workspaces } from '../../../../../db/schema'
import { inviteMemberSchema } from '#shared/schemas/workspaces'
import { hashToken, randomToken } from '../../../../utils/crypto'
import { recordAudit } from '../../../../utils/audit'
import { useDb } from '../../../../utils/db'
import { sendMail } from '../../../../utils/mail'
import { requireSession } from '../../../../utils/session'
import { assertSameWorkspace } from '../../../../utils/workspace'
import { requireAdmin } from '../../../../utils/workspace-role'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireAdmin(session)
  const workspaceId = getRouterParam(event, 'id')
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = inviteMemberSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)

  const db = useDb()
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  if (!ws || ws.type !== 'team') throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, workspaceId)

  const email = parsed.data.email.toLowerCase().trim()
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

  await db
    .update(workspaceInvites)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(workspaceInvites.workspaceId, workspaceId),
        eq(workspaceInvites.email, email),
        isNull(workspaceInvites.acceptedAt),
        isNull(workspaceInvites.revokedAt),
      ),
    )

  await db
    .delete(workspaceInvites)
    .where(
      and(
        eq(workspaceInvites.workspaceId, workspaceId),
        eq(workspaceInvites.email, email),
        isNull(workspaceInvites.acceptedAt),
      ),
    )

  const token = randomToken()
  const tokenHash = hashToken(token)

  const [invite] = await db
    .insert(workspaceInvites)
    .values({
      workspaceId,
      email,
      role: parsed.data.role,
      tokenHash,
      invitedByUserId: session.id,
      expiresAt,
    })
    .returning()

  const config = useRuntimeConfig()
  const acceptUrl = `${config.public.appUrl}/invites/accept?token=${encodeURIComponent(token)}`

  try {
    await sendMail({
      to: email,
      subject: `Join ${ws.name} on Hilko`,
      text: `You have been invited to collaborate on workspace "${ws.name}".\n\nOpen: ${acceptUrl}\n\nThis link expires in 7 days.`,
    })
  } catch (err) {
    serverError(err, 'workspace.invite.mail')
  }

  await recordAudit(db, session, {
    entityType: 'workspace_invite',
    entityId: invite.id,
    action: 'member.invite',
    safeDiff: { role: parsed.data.role, emailDomain: email.split('@')[1] },
  })

  return {
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    },
  }
})
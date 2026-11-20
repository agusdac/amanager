import { count, eq } from 'drizzle-orm'
import { users, workspaceInvites, workspaceMembers, workspaces } from '../../../db/schema'
import { registerSchema } from '../../../shared/schemas/auth'
import { hashPassword } from '../../utils/crypto'
import { useDb } from '../../utils/db'
import { findValidInviteForEmail } from '../../utils/invite-validation'
import { recordAudit } from '../../utils/audit'
import { createSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw invalidInputError(parsed.error)
  }

  const db = useDb()
  const config = useRuntimeConfig()
  const allowSignup = config.allowSignup
  const allowPublicRegister = config.allowPublicRegister !== false
  const inviteToken = parsed.data.inviteToken ?? null

  let inviteRow: Awaited<ReturnType<typeof findValidInviteForEmail>> | null = null
  if (inviteToken) {
    inviteRow = await findValidInviteForEmail(db, inviteToken, parsed.data.email)
  }

  const [{ value: userCount }] = await db.select({ value: count() }).from(users)

  if (!allowPublicRegister && !inviteToken) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Registration is disabled',
      data: { code: 'registration_disabled' },
    })
  }

  if (userCount > 0 && !allowSignup && !inviteRow) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Registration is closed',
      data:
        process.env.NODE_ENV !== 'production'
          ? {
              hint:
                'Hilko allows self-registration only for the first account (owner). Sign in if you already have one, set NUXT_ALLOW_SIGNUP=true in .env and restart dev for extra accounts, or remove stray users from the DB if you are bootstrapping locally.',
            }
          : undefined,
    })
  }

  let passwordHash: string
  try {
    passwordHash = await hashPassword(parsed.data.password)
  } catch (err) {
    serverError(err, 'auth.register.hashPassword')
  }

  const locale = parsed.data.locale === 'es' ? 'es' : 'en'
  const theme = parsed.data.theme === 'dark' ? 'dark' : 'light'

  try {
    const [user] = await db
      .insert(users)
      .values({
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        name: parsed.data.name,
        locale,
        theme,
      })
      .returning()

    let initialWorkspaceId: string | undefined
    const includePersonal =
      !!inviteRow && parsed.data.includePersonalWorkspace === true

    if (inviteRow) {
      if (includePersonal) {
        const [personal] = await db
          .insert(workspaces)
          .values({
            type: 'personal',
            name: 'Personal',
            ownerUserId: user.id,
          })
          .returning()
        await db.insert(workspaceMembers).values({
          workspaceId: personal.id,
          userId: user.id,
          role: 'owner',
        })
      }

      await db
        .insert(workspaceMembers)
        .values({
          workspaceId: inviteRow.workspaceId,
          userId: user.id,
          role: inviteRow.role,
        })
        .onConflictDoUpdate({
          target: [workspaceMembers.workspaceId, workspaceMembers.userId],
          set: { role: inviteRow.role },
        })
      await db
        .update(workspaceInvites)
        .set({ acceptedAt: new Date() })
        .where(eq(workspaceInvites.id, inviteRow.id))
      await recordAudit(db, { workspaceId: inviteRow.workspaceId, userId: user.id }, {
        entityType: 'workspace_member',
        entityId: user.id,
        action: 'member.join',
        safeDiff: { role: inviteRow.role, via: 'register' },
      })
      initialWorkspaceId = inviteRow.workspaceId
    } else if (parsed.data.signupPlan === 'team') {
      const teamName = parsed.data.teamName!.trim()
      const [team] = await db
        .insert(workspaces)
        .values({
          type: 'team',
          name: teamName,
          ownerUserId: user.id,
        })
        .returning()
      await db.insert(workspaceMembers).values({
        workspaceId: team.id,
        userId: user.id,
        role: 'owner',
      })
      await recordAudit(db, { workspaceId: team.id, userId: user.id }, {
        entityType: 'workspace',
        entityId: team.id,
        action: 'workspace.create',
        safeDiff: { name: team.name, type: 'team', via: 'register' },
      })
      initialWorkspaceId = team.id
    } else {
      const [workspace] = await db
        .insert(workspaces)
        .values({
          type: 'personal',
          name: 'Personal',
          ownerUserId: user.id,
        })
        .returning()
      await db.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      })
      initialWorkspaceId = workspace.id
    }

    await createSession(event, user.id, initialWorkspaceId)

    return {
      user: { id: user.id, email: user.email, name: user.name },
      workspaceId: initialWorkspaceId,
    }
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
    }
    serverError(err, 'auth.register')
  }
})
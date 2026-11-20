import { count, eq } from 'drizzle-orm'
import { users, workspaceMembers, workspaces } from '../../../db/schema'
import { registerSchema } from '../../../shared/schemas/auth'
import { hashPassword } from '../../utils/crypto'
import { useDb } from '../../utils/db'
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
  const [{ value: userCount }] = await db.select({ value: count() }).from(users)

  if (userCount > 0 && !allowSignup) {
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

  try {
    const localeCookie = getCookie(event, 'i18n_locale')
    const locale = localeCookie === 'es' ? 'es' : 'en'

    const [user] = await db
      .insert(users)
      .values({
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        name: parsed.data.name,
        locale,
      })
      .returning()

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

    await createSession(event, user.id)

    return {
      user: { id: user.id, email: user.email, name: user.name },
      workspace: { id: workspace.id, name: workspace.name },
    }
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
    }
    serverError(err, 'auth.register')
  }
})
import { eq } from 'drizzle-orm'
import { users } from '../../../db/schema'
import { loginSchema } from '../../../shared/schemas/auth'
import { verifyPassword } from '../../utils/crypto'
import { useDb } from '../../utils/db'
import { createSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw invalidInputError(parsed.error)
  }

  const db = useDb()
  const email = parsed.data.email.toLowerCase()
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  await createSession(event, user.id)

  return { user: { id: user.id, email: user.email, name: user.name } }
})
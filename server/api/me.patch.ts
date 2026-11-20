import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../db/schema'
import { useDb } from '../utils/db'
import { requireSession } from '../utils/session'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  locale: z.enum(['en', 'es']).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)
  if (!parsed.data.name && !parsed.data.locale) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  }

  const db = useDb()
  const [updated] = await db
    .update(users)
    .set({
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.locale ? { locale: parsed.data.locale } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      locale: users.locale,
    })

  return { user: updated }
})
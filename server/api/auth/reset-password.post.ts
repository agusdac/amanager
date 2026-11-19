import { and, eq, gt } from 'drizzle-orm'
import { passwordResetTokens, users } from '../../../db/schema'
import { resetPasswordSchema } from '../../../shared/schemas/auth'
import { hashPassword, hashToken } from '../../utils/crypto'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const db = useDb()
  const tokenHash = hashToken(parsed.data.token)
  const now = new Date()

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), gt(passwordResetTokens.expiresAt, now)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired token' })
  }

  const passwordHash = await hashPassword(parsed.data.password)
  await db.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, row.userId))
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, row.id))

  return { ok: true }
})
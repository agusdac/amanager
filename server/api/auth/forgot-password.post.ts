import { eq } from 'drizzle-orm'
import { passwordResetTokens, users } from '../../../db/schema'
import { forgotPasswordSchema } from '../../../shared/schemas/auth'
import { hashToken, randomToken } from '../../utils/crypto'
import { useDb } from '../../utils/db'
import { sendMail } from '../../utils/mail'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const db = useDb()
  const email = parsed.data.email.toLowerCase()
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (user) {
    const token = randomToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    })

    const baseUrl = process.env.NUXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`
    await sendMail({
      to: user.email,
      subject: 'Reset your Hilko password',
      text: `Use this link within one hour:\n\n${link}\n`,
    })
  }

  return { ok: true }
})
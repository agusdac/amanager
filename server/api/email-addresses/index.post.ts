import { createEmailSchema } from '../../../shared/schemas/inventory'
import { emailAddresses, identityEmails } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createEmailSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [email] = await db
    .insert(emailAddresses)
    .values({
      workspaceId: session.workspaceId,
      address: parsed.data.address.toLowerCase(),
      label: parsed.data.label ?? null,
      mailboxType: parsed.data.mailboxType ?? null,
    })
    .returning()

  const purposes = parsed.data.purposes?.filter((p) => p.identityId) ?? []
  if (purposes.length) {
    await db.insert(identityEmails).values(
      purposes.map((p) => ({
        workspaceId: session.workspaceId,
        identityId: p.identityId!,
        emailId: email.id,
        purpose: p.purpose,
      })),
    )
  }

  await recordAudit(db, { workspaceId: session.workspaceId, userId: session.id }, {
    entityType: 'email_address',
    entityId: email.id,
    action: 'email.create',
    safeDiff: { address: email.address, label: email.label },
  })

  return { email }
})
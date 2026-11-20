import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { identities, emailAddresses } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { findOrCreateEmail, linkIdentityLoginEmail } from '../../utils/inventory-links'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

const linkSchema = z.object({
  identityId: z.string().uuid(),
  address: z.string().email().max(320),
  purpose: z.string().min(1).max(80).default('login'),
})

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = linkSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [identity] = await db
    .select()
    .from(identities)
    .where(and(eq(identities.id, parsed.data.identityId), eq(identities.workspaceId, session.workspaceId)))
    .limit(1)
  if (!identity) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const normalized = parsed.data.address.trim().toLowerCase()
  const [existingEmail] = await db
    .select({ id: emailAddresses.id })
    .from(emailAddresses)
    .where(and(eq(emailAddresses.workspaceId, session.workspaceId), eq(emailAddresses.address, normalized)))
    .limit(1)

  const email = await findOrCreateEmail(db, session.workspaceId, parsed.data.address)
  await linkIdentityLoginEmail(db, session.workspaceId, parsed.data.identityId, email.address)

  await recordAudit(db, { workspaceId: session.workspaceId, userId: session.id }, {
    entityType: 'identity',
    entityId: identity.id,
    action: 'identity.email_link',
    safeDiff: { address: email.address, purpose: parsed.data.purpose },
  })

  return {
    email: { id: email.id, address: email.address },
    purpose: parsed.data.purpose,
    workspaceEmailCreated: !existingEmail,
  }
})
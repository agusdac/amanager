import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { assets, emailAddresses } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { findOrCreateEmail, linkAssetLoginEmail } from '../../utils/inventory-links'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

const linkSchema = z.object({
  assetId: z.string().uuid(),
  address: z.string().email().max(320),
  purpose: z.string().min(1).max(80).default('login'),
  identityId: z.string().uuid().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = linkSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, parsed.data.assetId), eq(assets.workspaceId, session.workspaceId)))
    .limit(1)
  if (!asset) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const normalized = parsed.data.address.trim().toLowerCase()
  const [existingEmail] = await db
    .select({ id: emailAddresses.id })
    .from(emailAddresses)
    .where(and(eq(emailAddresses.workspaceId, session.workspaceId), eq(emailAddresses.address, normalized)))
    .limit(1)

  const email = await findOrCreateEmail(db, session.workspaceId, parsed.data.address)
  await linkAssetLoginEmail(db, session.workspaceId, parsed.data.assetId, email.id, parsed.data.identityId)

  return {
    email: { id: email.id, address: email.address },
    purpose: parsed.data.purpose,
    workspaceEmailCreated: !existingEmail,
  }
})
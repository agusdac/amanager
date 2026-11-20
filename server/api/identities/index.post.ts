import { createIdentitySchema } from '../../../shared/schemas/inventory'
import { identities } from '../../../db/schema'
import { linkIdentityLoginEmail } from '../../utils/inventory-links'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = createIdentitySchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [identity] = await db
    .insert(identities)
    .values({
      workspaceId: session.workspaceId,
      label: parsed.data.label,
      providerId: parsed.data.providerId ?? null,
      principalType: parsed.data.principalType ?? 'person',
      authMethod: parsed.data.authMethod ?? 'unknown',
      notes: parsed.data.notes ?? null,
    })
    .returning()

  const loginEmail = parsed.data.loginEmail?.trim()
  let loginEmailLinked = false
  if (loginEmail) {
    await linkIdentityLoginEmail(db, session.workspaceId, identity.id, loginEmail)
    loginEmailLinked = true
  }

  return { identity, loginEmailLinked, loginEmail: loginEmail || null }
})
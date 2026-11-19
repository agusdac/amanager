import { createIdentitySchema } from '../../../shared/schemas/inventory'
import { identities } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
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

  return { identity }
})
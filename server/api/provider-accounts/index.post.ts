import { createProviderAccountSchema } from '../../../shared/schemas/inventory'
import { providerAccounts } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = createProviderAccountSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [account] = await db
    .insert(providerAccounts)
    .values({
      workspaceId: session.workspaceId,
      label: parsed.data.label,
      providerId: parsed.data.providerId ?? null,
      accountIdentifier: parsed.data.accountIdentifier ?? null,
    })
    .returning()

  return { account }
})
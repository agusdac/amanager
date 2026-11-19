import { eq } from 'drizzle-orm'
import { identities, providers } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const list = await db
    .select({
      identity: identities,
      providerName: providers.name,
    })
    .from(identities)
    .leftJoin(providers, eq(identities.providerId, providers.id))
    .where(eq(identities.workspaceId, session.workspaceId))
  return {
    identities: list.map((r) => ({ ...r.identity, providerName: r.providerName })),
  }
})
import { eq } from 'drizzle-orm'
import { providerAccounts, providers } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const list = await db
    .select({
      account: providerAccounts,
      providerName: providers.name,
    })
    .from(providerAccounts)
    .leftJoin(providers, eq(providerAccounts.providerId, providers.id))
    .where(eq(providerAccounts.workspaceId, session.workspaceId))
  return {
    accounts: list.map((r) => ({ ...r.account, providerName: r.providerName })),
  }
})
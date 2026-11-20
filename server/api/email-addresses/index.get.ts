import { and, eq, inArray, sql } from 'drizzle-orm'
import { assetEmails, emailAddresses, identityEmails } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const list = await db
    .select()
    .from(emailAddresses)
    .where(eq(emailAddresses.workspaceId, session.workspaceId))
    .orderBy(emailAddresses.address)

  const ids = list.map((e) => e.id)
  if (!ids.length) return { emails: [] }

  const [identityCounts, assetCounts] = await Promise.all([
    db
      .select({
        emailId: identityEmails.emailId,
        n: sql<number>`count(*)::int`,
      })
      .from(identityEmails)
      .where(
        and(eq(identityEmails.workspaceId, session.workspaceId), inArray(identityEmails.emailId, ids)),
      )
      .groupBy(identityEmails.emailId),
    db
      .select({
        emailId: assetEmails.emailId,
        n: sql<number>`count(*)::int`,
      })
      .from(assetEmails)
      .where(and(eq(assetEmails.workspaceId, session.workspaceId), inArray(assetEmails.emailId, ids)))
      .groupBy(assetEmails.emailId),
  ])

  const identityByEmail = new Map(identityCounts.map((r) => [r.emailId, r.n]))
  const assetByEmail = new Map(assetCounts.map((r) => [r.emailId, r.n]))

  const emails = list.map((email) => ({
    ...email,
    identityLinkCount: identityByEmail.get(email.id) ?? 0,
    assetLinkCount: assetByEmail.get(email.id) ?? 0,
  }))

  return { emails }
})
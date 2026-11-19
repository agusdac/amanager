import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { assetEmails, emailAddresses, identityEmails } from '../../db/schema'
import type * as schema from '../../db/schema'

type Db = NodePgDatabase<typeof schema>

export async function findOrCreateEmail(db: Db, workspaceId: string, address: string) {
  const normalized = address.trim().toLowerCase()
  const [existing] = await db
    .select()
    .from(emailAddresses)
    .where(and(eq(emailAddresses.workspaceId, workspaceId), eq(emailAddresses.address, normalized)))
    .limit(1)
  if (existing) return existing

  const [created] = await db
    .insert(emailAddresses)
    .values({
      workspaceId,
      address: normalized,
      label: null,
    })
    .returning()
  return created
}

export async function linkAssetLoginEmail(
  db: Db,
  workspaceId: string,
  assetId: string,
  emailId: string,
  identityId?: string | null,
) {
  const [existingLink] = await db
    .select()
    .from(assetEmails)
    .where(
      and(
        eq(assetEmails.workspaceId, workspaceId),
        eq(assetEmails.assetId, assetId),
        eq(assetEmails.emailId, emailId),
        eq(assetEmails.purpose, 'login'),
      ),
    )
    .limit(1)
  if (!existingLink) {
    await db.insert(assetEmails).values({
      workspaceId,
      assetId,
      emailId,
      purpose: 'login',
    })
  }

  if (identityId) {
    const [identityLink] = await db
      .select()
      .from(identityEmails)
      .where(
        and(
          eq(identityEmails.workspaceId, workspaceId),
          eq(identityEmails.identityId, identityId),
          eq(identityEmails.emailId, emailId),
          eq(identityEmails.purpose, 'login'),
        ),
      )
      .limit(1)
    if (!identityLink) {
      await db.insert(identityEmails).values({
        workspaceId,
        identityId,
        emailId,
        purpose: 'login',
      })
    }
  }
}
import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import {
  assetEmails,
  assets,
  emailAddresses,
  identities,
  identityEmails,
  providers,
} from '../../db/schema'
import { useDb } from '../utils/db'
import { assetIdsForProject } from '../utils/projectScope'
import { requireSession } from '../utils/session'

const LIMIT = 8

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const q = String(getQuery(event).q ?? '')
    .trim()
    .slice(0, 200)
  if (q.length < 2) {
    return { query: q, assets: [] as const, emails: [] as const, identities: [] as const }
  }

  const db = useDb()
  const ws = session.workspaceId
  const pattern = `%${q}%`
  const projectId = typeof getQuery(event).projectId === 'string' ? getQuery(event).projectId : undefined
  const scopedAssetIds = projectId ? await assetIdsForProject(db, ws, projectId) : undefined

  const assetScope =
    scopedAssetIds === undefined
      ? undefined
      : scopedAssetIds.length
        ? inArray(assets.id, scopedAssetIds)
        : sql`false`

  const assetRows = await db
    .select({
      id: assets.id,
      name: assets.name,
      type: assets.type,
      providerName: providers.name,
      providerSlug: providers.slug,
    })
    .from(assets)
    .leftJoin(providers, eq(providers.id, assets.providerId))
    .where(
      and(
        eq(assets.workspaceId, ws),
        ...(assetScope ? [assetScope] : []),
        or(
          ilike(assets.name, pattern),
          ilike(assets.type, pattern),
          ilike(assets.description, pattern),
          ilike(assets.externalIdentifier, pattern),
          sql`exists (
            select 1 from asset_emails ae
            inner join email_addresses em on em.id = ae.email_id
            where ae.asset_id = ${assets.id}
              and ae.workspace_id = ${ws}
              and em.address ilike ${pattern}
          )`,
        )!,
      ),
    )
    .limit(LIMIT)

  const emailRows =
    scopedAssetIds && !scopedAssetIds.length
      ? []
      : await db
          .selectDistinct({
            id: emailAddresses.id,
            address: emailAddresses.address,
            label: emailAddresses.label,
          })
          .from(emailAddresses)
          .where(
            and(
              eq(emailAddresses.workspaceId, ws),
              ilike(emailAddresses.address, pattern),
              ...(scopedAssetIds?.length
                ? [
                    sql`exists (
                      select 1 from asset_emails ae
                      where ae.email_id = ${emailAddresses.id}
                        and ae.workspace_id = ${ws}
                        and ae.asset_id in (${sql.join(
                          scopedAssetIds.map((id) => sql`${id}`),
                          sql`, `,
                        )})
                    )`,
                  ]
                : []),
            ),
          )
          .limit(LIMIT)

  const identityRows =
    scopedAssetIds && !scopedAssetIds.length
      ? []
      : await db
          .select({
            id: identities.id,
            label: identities.label,
            providerName: providers.name,
          })
          .from(identities)
          .leftJoin(providers, eq(providers.id, identities.providerId))
          .where(
            and(
              eq(identities.workspaceId, ws),
              ...(projectId
                ? [
                    sql`exists (
                      select 1 from identity_emails ie
                      inner join asset_emails ae on ae.email_id = ie.email_id and ae.workspace_id = ${ws}
                      inner join project_assets pa on pa.asset_id = ae.asset_id and pa.workspace_id = ${ws}
                      where ie.identity_id = ${identities.id}
                        and ie.workspace_id = ${ws}
                        and pa.project_id = ${projectId}
                    )`,
                  ]
                : []),
              or(
                ilike(identities.label, pattern),
                sql`exists (
                  select 1 from identity_emails ie
                  inner join email_addresses em on em.id = ie.email_id
                  where ie.identity_id = ${identities.id}
                    and em.address ilike ${pattern}
                )`,
              )!,
            ),
          )
          .limit(LIMIT)

  const emailIds = emailRows.map((e) => e.id)
  const assetsByEmail =
    emailIds.length > 0
      ? await db
          .select({
            emailId: assetEmails.emailId,
            assetId: assets.id,
            assetName: assets.name,
          })
          .from(assetEmails)
          .innerJoin(assets, eq(assets.id, assetEmails.assetId))
          .where(
            and(
              eq(assetEmails.workspaceId, ws),
              inArray(assetEmails.emailId, emailIds),
              ...(scopedAssetIds?.length ? [inArray(assetEmails.assetId, scopedAssetIds)] : []),
            ),
          )
      : []

  const emails = emailRows.map((e) => ({
    ...e,
    linkedAssets: assetsByEmail
      .filter((l) => l.emailId === e.id)
      .map((l) => ({ id: l.assetId, name: l.assetName })),
  }))

  const idList = identityRows.map((i) => i.id)
  const identityEmailLinks =
    idList.length > 0
      ? await db
          .select({
            identityId: identityEmails.identityId,
            address: emailAddresses.address,
          })
          .from(identityEmails)
          .innerJoin(emailAddresses, eq(emailAddresses.id, identityEmails.emailId))
          .where(and(eq(identityEmails.workspaceId, ws), inArray(identityEmails.identityId, idList)))
      : []

  const identitiesOut = identityRows.map((i) => ({
    id: i.id,
    label: i.label,
    providerName: i.providerName,
    emails: identityEmailLinks.filter((l) => l.identityId === i.id).map((l) => l.address),
  }))

  return { query: q, assets: assetRows, emails, identities: identitiesOut }
})
import { and, eq, sql } from 'drizzle-orm'
import { identities, providers } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const projectId = typeof getQuery(event).projectId === 'string' ? getQuery(event).projectId : undefined

  const baseQuery = db
    .select({
      identity: identities,
      providerName: providers.name,
    })
    .from(identities)
    .leftJoin(providers, eq(identities.providerId, providers.id))

  const list = projectId
    ? await baseQuery
        .where(
          and(
            eq(identities.workspaceId, session.workspaceId),
            sql`exists (
              select 1 from identity_emails ie
              inner join asset_emails ae on ae.email_id = ie.email_id and ae.workspace_id = ${session.workspaceId}
              inner join project_assets pa on pa.asset_id = ae.asset_id and pa.workspace_id = ${session.workspaceId}
              where ie.identity_id = ${identities.id}
                and ie.workspace_id = ${session.workspaceId}
                and pa.project_id = ${projectId}
            )`,
          ),
        )
    : await baseQuery.where(eq(identities.workspaceId, session.workspaceId))
  return {
    identities: list.map((r) => ({ ...r.identity, providerName: r.providerName })),
  }
})